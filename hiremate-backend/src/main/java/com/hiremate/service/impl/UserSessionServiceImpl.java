package com.hiremate.service.impl;

import com.hiremate.dto.response.UserSessionDTO;
import com.hiremate.entity.User;
import com.hiremate.service.TokenBlacklistService;
import com.hiremate.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionServiceImpl implements UserSessionService {

    private final TokenBlacklistService tokenBlacklistService;

    // Map: userId -> List of active UserSessionDTO
    private final Map<Long, List<UserSessionDTO>> userSessionsMap = new ConcurrentHashMap<>();

    // Map: token -> UserSessionDTO
    private final Map<String, UserSessionDTO> tokenSessionMap = new ConcurrentHashMap<>();

    @Override
    public void recordSession(Long userId, String token, String refreshToken, HttpServletRequest request) {
        if (userId == null || token == null || token.isBlank()) return;
        String userAgent = request != null ? request.getHeader("User-Agent") : "";
        String ip = extractClientIp(request);
        recordSession(userId, token, refreshToken, userAgent, ip);
    }

    @Override
    public void recordSession(Long userId, String token, String refreshToken, String userAgent, String clientIp) {
        if (userId == null || token == null || token.isBlank()) return;

        DeviceInfo info = parseUserAgent(userAgent);
        String locationStr = formatLocation(clientIp);

        long now = System.currentTimeMillis();
        String sessionId = "sess_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        UserSessionDTO session = UserSessionDTO.builder()
                .sessionId(sessionId)
                .userId(userId)
                .token(token.trim())
                .refreshToken(refreshToken != null ? refreshToken.trim() : null)
                .device(info.deviceTitle)
                .browser(info.browser)
                .os(info.os)
                .icon(info.icon)
                .ipAddress(clientIp)
                .location(locationStr)
                .createdAt(now)
                .lastActiveAt(now)
                .timeDisplay("Đang hoạt động (Hiện tại)")
                .isCurrent(true)
                .build();

        List<UserSessionDTO> list = userSessionsMap.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());

        // Chỉ gỡ bỏ phiên khi TRÙNG TOKEN hoặc TRÙNG REFRESH TOKEN (gia hạn phiên hoặc login lại trên cùng trình duyệt)
        // Tuyệt đối không xóa theo Device/IP để cho phép nhiều máy tính/thiết bị đăng nhập đồng thời
        list.removeIf(s ->
                (s.getToken() != null && s.getToken().equals(session.getToken())) ||
                (session.getRefreshToken() != null && session.getRefreshToken().equals(s.getRefreshToken()))
        );
        list.add(0, session);

        // Giới hạn tối đa 10 phiên đồng thời gần nhất cho mỗi tài khoản
        while (list.size() > 10) {
            UserSessionDTO removed = list.remove(list.size() - 1);
            if (removed.getToken() != null) {
                tokenSessionMap.remove(removed.getToken());
            }
        }

        tokenSessionMap.put(token.trim(), session);
        log.info(">> [UserSession] Ghi nhận phiên đăng nhập mới: userId={}, device={}, ip={}, tổng số phiên={}", userId, info.deviceTitle, clientIp, list.size());
    }

    @Override
    public List<UserSessionDTO> getUserSessions(User user, String currentToken) {
        if (user == null) return Collections.emptyList();
        Long uid = user.getUserId();
        List<UserSessionDTO> rawList = userSessionsMap.computeIfAbsent(uid, k -> new CopyOnWriteArrayList<>());

        String cleanCurrent = currentToken != null ? currentToken.trim() : "";

        // Kiểm tra xem token hiện tại đã có trong danh sách phiên chưa
        boolean hasCurrent = false;
        if (!cleanCurrent.isBlank()) {
            for (UserSessionDTO s : rawList) {
                if (s.getToken() != null && s.getToken().equals(cleanCurrent)) {
                    hasCurrent = true;
                    break;
                }
            }
        }

        // Nếu token hiện tại chưa được ghi nhận (ví dụ đăng nhập trước khi restart), tự động tạo phiên hiện tại
        if (!hasCurrent && !cleanCurrent.isBlank()) {
            recordSession(uid, cleanCurrent, null, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/132.0.0.0 Safari/537.36", "127.0.0.1");
        }

        List<UserSessionDTO> result = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (UserSessionDTO s : rawList) {
            boolean isCur = !cleanCurrent.isBlank() && cleanCurrent.equals(s.getToken());
            String timeText;
            if (isCur) {
                timeText = "Đang hoạt động (Hiện tại)";
            } else {
                long diffMinutes = (now - s.getLastActiveAt()) / 60000;
                if (diffMinutes < 1) {
                    timeText = "Vừa mới truy cập";
                } else if (diffMinutes < 60) {
                    timeText = diffMinutes + " phút trước";
                } else if (diffMinutes < 1440) {
                    timeText = (diffMinutes / 60) + " giờ trước";
                } else {
                    timeText = (diffMinutes / 1440) + " ngày trước";
                }
            }

            result.add(UserSessionDTO.builder()
                    .sessionId(s.getSessionId())
                    .userId(s.getUserId())
                    .device(s.getDevice())
                    .browser(s.getBrowser())
                    .os(s.getOs())
                    .icon(s.getIcon())
                    .ipAddress(s.getIpAddress())
                    .location(s.getLocation())
                    .createdAt(s.getCreatedAt())
                    .lastActiveAt(s.getLastActiveAt())
                    .timeDisplay(timeText)
                    .isCurrent(isCur)
                    .build());
        }

        // Nếu không có phiên nào khớp cleanCurrent nhưng danh sách có phần tử, đánh dấu phiên đầu tiên là phiên hiện tại
        boolean anyCurrent = result.stream().anyMatch(UserSessionDTO::isCurrent);
        if (!anyCurrent && !result.isEmpty()) {
            result.get(0).setCurrent(true);
            result.get(0).setTimeDisplay("Đang hoạt động (Hiện tại)");
        }

        // Sắp xếp phiên hiện tại lên đầu tiên, sau đó theo lastActiveAt giảm dần
        result.sort((a, b) -> {
            if (a.isCurrent()) return -1;
            if (b.isCurrent()) return 1;
            return Long.compare(b.getLastActiveAt(), a.getLastActiveAt());
        });

        return result;
    }

    @Override
    public void touchSession(String token) {
        if (token == null || token.isBlank()) return;
        UserSessionDTO sess = tokenSessionMap.get(token.trim());
        if (sess != null) {
            sess.setLastActiveAt(System.currentTimeMillis());
        }
    }

    @Override
    public void recordOrTouchSession(Long userId, String token, HttpServletRequest request) {
        if (userId == null || token == null || token.isBlank()) return;
        String cleanToken = token.trim();
        UserSessionDTO sess = tokenSessionMap.get(cleanToken);
        long now = System.currentTimeMillis();
        if (sess != null) {
            sess.setLastActiveAt(now);
        } else {
            // Token chưa có trong session map (ví dụ request đến sau khi server restart hoặc từ thiết bị khác)
            String userAgent = request != null ? request.getHeader("User-Agent") : "";
            String ip = extractClientIp(request);
            recordSession(userId, cleanToken, null, userAgent, ip);
        }
    }

    @Override
    public void revokeSession(User user, String sessionId) {
        if (user == null || sessionId == null || sessionId.isBlank()) return;
        List<UserSessionDTO> list = userSessionsMap.get(user.getUserId());
        if (list == null) return;

        UserSessionDTO target = null;
        for (UserSessionDTO s : list) {
            if (sessionId.equals(s.getSessionId())) {
                target = s;
                break;
            }
        }

        if (target != null) {
            list.remove(target);
            if (target.getToken() != null) {
                tokenBlacklistService.blacklistToken(target.getToken(), System.currentTimeMillis() + 86400000L);
                tokenSessionMap.remove(target.getToken());
            }
            if (target.getRefreshToken() != null) {
                tokenBlacklistService.blacklistToken(target.getRefreshToken(), System.currentTimeMillis() + 7L * 86400000L);
            }
            log.info(">> [UserSession] Đã thu hồi phiên đăng nhập: sessionId={}, userId={}", sessionId, user.getUserId());
        }
    }

    @Override
    public void revokeAllOtherSessions(User user, String currentToken) {
        if (user == null) return;
        List<UserSessionDTO> list = userSessionsMap.get(user.getUserId());
        if (list == null) return;

        String cleanCurrent = currentToken != null ? currentToken.trim() : "";
        List<UserSessionDTO> toRemove = new ArrayList<>();

        for (UserSessionDTO s : list) {
            if (s.getToken() == null || !s.getToken().equals(cleanCurrent)) {
                toRemove.add(s);
            }
        }

        for (UserSessionDTO rem : toRemove) {
            list.remove(rem);
            if (rem.getToken() != null) {
                tokenBlacklistService.blacklistToken(rem.getToken(), System.currentTimeMillis() + 86400000L);
                tokenSessionMap.remove(rem.getToken());
            }
            if (rem.getRefreshToken() != null) {
                tokenBlacklistService.blacklistToken(rem.getRefreshToken(), System.currentTimeMillis() + 7L * 86400000L);
            }
        }

        log.info(">> [UserSession] Đã thu hồi {} phiên đăng nhập khác của userId={}", toRemove.size(), user.getUserId());
    }

    // --- Helper Methods ---

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "CF-Connecting-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };
        for (String h : headers) {
            String val = request.getHeader(h);
            if (val != null && !val.isBlank() && !"unknown".equalsIgnoreCase(val.trim())) {
                // First IP in comma-separated chain
                return val.split(",")[0].trim();
            }
        }
        String remote = request.getRemoteAddr();
        if (remote == null || remote.equals("0:0:0:0:0:0:0:1") || remote.equals("::1")) {
            return "127.0.0.1";
        }
        return remote;
    }

    private String formatLocation(String ip) {
        if (ip == null || ip.equals("127.0.0.1") || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
            return "Mạng nội bộ / Kết nối an toàn (IP: " + (ip != null ? ip : "127.0.0.1") + ")";
        }
        return "Việt Nam (IP: " + ip + ")";
    }

    private static class DeviceInfo {
        String os;
        String browser;
        String icon;
        String deviceTitle;
    }

    private DeviceInfo parseUserAgent(String ua) {
        DeviceInfo d = new DeviceInfo();
        if (ua == null || ua.isBlank()) {
            d.os = "Windows 10 / 11";
            d.browser = "Trình duyệt Web";
            d.icon = "laptop_windows";
            d.deviceTitle = "Thiết bị Web";
            return d;
        }

        // Detect OS
        if (ua.contains("iPhone")) {
            d.os = "Apple iPhone (iOS)";
            d.icon = "smartphone";
        } else if (ua.contains("iPad")) {
            d.os = "Apple iPad (iPadOS)";
            d.icon = "tablet_mac";
        } else if (ua.contains("Android")) {
            d.os = "Android Device";
            d.icon = "smartphone";
        } else if (ua.contains("Macintosh") || ua.contains("Mac OS X")) {
            d.os = "Apple macOS";
            d.icon = "laptop_mac";
        } else if (ua.contains("Linux")) {
            d.os = "Linux Desktop";
            d.icon = "desktop_windows";
        } else if (ua.contains("Windows NT 10.0")) {
            d.os = "Windows 10 / 11";
            d.icon = "laptop_windows";
        } else if (ua.contains("Windows")) {
            d.os = "Windows PC";
            d.icon = "laptop_windows";
        } else {
            d.os = "Thiết bị bảo mật";
            d.icon = "devices";
        }

        // Detect Browser
        if (ua.contains("Edg/")) {
            d.browser = "Microsoft Edge";
        } else if (ua.contains("Chrome/") && !ua.contains("Edg/")) {
            d.browser = "Google Chrome";
        } else if (ua.contains("Firefox/")) {
            d.browser = "Mozilla Firefox";
        } else if (ua.contains("Safari/") && !ua.contains("Chrome")) {
            d.browser = "Apple Safari";
        } else if (ua.contains("OPR/") || ua.contains("Opera")) {
            d.browser = "Opera Browser";
        } else {
            d.browser = "Trình duyệt Web";
        }

        d.deviceTitle = d.os + " • " + d.browser;
        return d;
    }
}
