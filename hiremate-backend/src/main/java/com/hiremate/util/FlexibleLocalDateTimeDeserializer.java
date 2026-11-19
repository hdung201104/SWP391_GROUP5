package com.hiremate.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Jackson Deserializer linh hoạt cho LocalDateTime:
 * Chấp nhận đồng thời các định dạng ISO từ Frontend JS như:
 * - "2026-12-31T23:59:59" (LocalDateTime chuẩn)
 * - "2026-12-31T16:59:59.000Z" (ISO-8601 UTC từ Date.toISOString())
 * - "2026-12-31T23:59:59+07:00" (OffsetDateTime)
 * - "2026-12-31" (LocalDate)
 */
public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String raw = p.getText();
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.trim();
        try {
            if (text.length() == 10 && text.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(text, DateTimeFormatter.ISO_LOCAL_DATE).atTime(23, 59, 59);
            }
            if (text.endsWith("Z") || text.endsWith("z")) {
                return Instant.parse(text).atZone(ZoneId.systemDefault()).toLocalDateTime();
            }
            if (text.matches(".*[+-]\\d{2}:?\\d{2}$")) {
                return OffsetDateTime.parse(text).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
            }
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(text.replace(" ", "T"));
            } catch (Exception ignored) {
                throw new IOException("Không thể phân tích thời gian LocalDateTime từ chuỗi: '" + text + "'", e);
            }
        }
    }
}

