package com.hiremate.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Microsoft Edge / Azure Neural TTS Client - Hoàn toàn miễn phí, không cần API Key.
 * Giọng đọc tiếng Việt tự nhiên chuẩn phòng thu:
 * - Nữ: vi-VN-HoaiMyNeural (truyền cảm, chuẩn xác)
 * - Nam: vi-VN-NamMinhNeural (trầm ấm, chuyên gia)
 */
@Slf4j
@Component
public class EdgeTtsClient {

    private static final String TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static final String CHROMIUM_VERSION = "143.0.3650.75";
    private static final String WSS_BASE =
            "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=" + TRUSTED_CLIENT_TOKEN;
    private static final long WIN_EPOCH_SECONDS = 11644473600L;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ConcurrentHashMap<String, byte[]> cache = new ConcurrentHashMap<>();
    private final java.util.concurrent.atomic.AtomicInteger consecutiveFailures = new java.util.concurrent.atomic.AtomicInteger(0);
    private volatile long circuitOpenUntilMs = 0L;

    public byte[] synthesize(String text, String voiceName) {
        return synthesize(text, voiceName, false);
    }

    public byte[] synthesize(String text, String voiceName, boolean isEnglish) {
        if (text == null || text.isBlank()) return new byte[0];
        if (System.currentTimeMillis() < circuitOpenUntilMs) {
            return new byte[0];
        }
        String targetVoice = resolveVoiceName(voiceName, isEnglish);
        String key = targetVoice + "|" + text.trim();
        byte[] cached = cache.get(key);
        if (cached != null && cached.length > 0) return cached;

        byte[] audio = doSynthesize(text.trim(), targetVoice);
        if (audio.length > 0) {
            consecutiveFailures.set(0);
            if (cache.size() > 400) cache.clear();
            cache.put(key, audio);
        } else {
            int fails = consecutiveFailures.incrementAndGet();
            if (fails >= 3) {
                circuitOpenUntilMs = System.currentTimeMillis() + 60_000L;
                log.warn(">> [EdgeTTS] Tạm ngưng 60s sau {} lỗi liên tiếp, chuyển ngay sang kênh dự phòng.", fails);
            }
        }
        return audio;
    }

    private String resolveVoiceName(String voice, boolean isEnglish) {
        String v = voice != null ? voice.toLowerCase().trim() : "female";
        boolean isFemaleExplicit = v.contains("female") || v.contains("nữ") || v.contains("hoaimy") || v.equals("vi-native");
        boolean isMale = !isFemaleExplicit && (v.equals("male") || v.contains("-male") || v.contains("_male")
                || v.contains("nam") || v.contains("minh") || v.contains("george"));
        boolean isBilingual = !isMale && (v.contains("eleven") || v.contains("alice") || v.contains("bilingual") || v.contains("song"));

        if (isEnglish) {
            return isMale ? "en-US-AndrewMultilingualNeural" : "en-US-AvaMultilingualNeural";
        }
        if (isMale) {
            return "vi-VN-NamMinhNeural";
        }
        if (isBilingual) {
            return "en-US-AvaMultilingualNeural";
        }
        return "vi-VN-HoaiMyNeural";
    }

    private byte[] doSynthesize(String text, String voiceName) {
        try {
            String connectionId = UUID.randomUUID().toString().replace("-", "");
            String muid = UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
            String url = WSS_BASE
                    + "&ConnectionId=" + connectionId
                    + "&Sec-MS-GEC=" + generateSecMsGec()
                    + "&Sec-MS-GEC-Version=1-" + CHROMIUM_VERSION;

            ByteArrayOutputStream audio = new ByteArrayOutputStream();
            CompletableFuture<Void> done = new CompletableFuture<>();
            StringBuilder textBuf = new StringBuilder();
            ByteArrayOutputStream binBuf = new ByteArrayOutputStream();

            WebSocket.Listener listener = new WebSocket.Listener() {
                @Override
                public void onOpen(WebSocket ws) {
                    ws.request(1);
                }

                @Override
                public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
                    textBuf.append(data);
                    if (last) {
                        String msg = textBuf.toString();
                        textBuf.setLength(0);
                        if (msg.contains("Path:turn.end")) {
                            done.complete(null);
                        }
                    }
                    ws.request(1);
                    return null;
                }

                @Override
                public CompletionStage<?> onBinary(WebSocket ws, ByteBuffer data, boolean last) {
                    byte[] chunk = new byte[data.remaining()];
                    data.get(chunk);
                    binBuf.write(chunk, 0, chunk.length);
                    if (last) {
                        byte[] frame = binBuf.toByteArray();
                        binBuf.reset();
                        if (frame.length > 2) {
                            int headerLen = ((frame[0] & 0xFF) << 8) | (frame[1] & 0xFF);
                            int bodyStart = 2 + headerLen;
                            if (bodyStart <= frame.length) {
                                String header = new String(frame, 2, headerLen, StandardCharsets.UTF_8);
                                if (header.contains("Path:audio")) {
                                    audio.write(frame, bodyStart, frame.length - bodyStart);
                                }
                            }
                        }
                    }
                    ws.request(1);
                    return null;
                }

                @Override
                public CompletionStage<?> onClose(WebSocket ws, int statusCode, String reason) {
                    done.complete(null);
                    return null;
                }

                @Override
                public void onError(WebSocket ws, Throwable error) {
                    done.completeExceptionally(error);
                }
            };

            WebSocket ws = httpClient.newWebSocketBuilder()
                    .header("Pragma", "no-cache")
                    .header("Cache-Control", "no-cache")
                    .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
                    .header("Cookie", "muid=" + muid + ";")
                    .header("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/"
                            + CHROMIUM_VERSION.split("\\.")[0] + ".0.0.0 Safari/537.36 Edg/" + CHROMIUM_VERSION.split("\\.")[0] + ".0.0.0")
                    .connectTimeout(Duration.ofSeconds(5))
                    .buildAsync(URI.create(url), listener)
                    .get(6, TimeUnit.SECONDS);

            String timestamp = DateTimeFormatter.ofPattern("EEE MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'", Locale.US)
                    .format(ZonedDateTime.now(ZoneOffset.UTC));

            String config = "X-Timestamp:" + timestamp + "\r\n"
                    + "Content-Type:application/json; charset=utf-8\r\n"
                    + "Path:speech.config\r\n\r\n"
                    + "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},"
                    + "\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}\r\n";
            ws.sendText(config, true).get(3, TimeUnit.SECONDS);

            String xmlLang = voiceName.startsWith("en-") ? "en-US" : "vi-VN";
            String rate = voiceName.startsWith("en-") ? "+2%" : "+4%";
            String pitch = voiceName.contains("NamMinh") ? "-2Hz" : "+0Hz";
            String ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='" + xmlLang + "'>"
                    + "<voice name='" + voiceName + "'><prosody pitch='" + pitch + "' rate='" + rate + "' volume='+0%'>"
                    + escapeXml(text) + "</prosody></voice></speak>";
            String ssmlMsg = "X-RequestId:" + UUID.randomUUID().toString().replace("-", "") + "\r\n"
                    + "Content-Type:application/ssml+xml\r\n"
                    + "X-Timestamp:" + timestamp + "Z\r\n"
                    + "Path:ssml\r\n\r\n" + ssml;
            ws.sendText(ssmlMsg, true).get(3, TimeUnit.SECONDS);

            done.get(8, TimeUnit.SECONDS);
            try {
                ws.sendClose(WebSocket.NORMAL_CLOSURE, "done");
            } catch (Exception ignored) {}

            byte[] result = audio.toByteArray();
            log.info(">> [EdgeTTS] Tổng hợp thành công giọng {} - {} bytes", voiceName, result.length);
            return result;
        } catch (Exception e) {
            if (e instanceof java.util.concurrent.ExecutionException && e.getCause() instanceof java.net.http.WebSocketHandshakeException we) {
                log.warn(">> [EdgeTTS] WebSocketHandshakeException HTTP Response: {} - Body: {}", we.getResponse().statusCode(), we.getResponse().body());
            } else {
                log.warn(">> [EdgeTTS] Lỗi tổng hợp giọng {}: {}", voiceName, e.getMessage(), e);
            }
            return new byte[0];
        }
    }

    private String generateSecMsGec() throws Exception {
        long ticks = System.currentTimeMillis() / 1000 + WIN_EPOCH_SECONDS;
        ticks -= ticks % 300;
        String toHash = String.format("%d", ticks * 10_000_000L) + TRUSTED_CLIENT_TOKEN;
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(toHash.getBytes(StandardCharsets.US_ASCII));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02X", b));
        return sb.toString();
    }

    private static String escapeXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
