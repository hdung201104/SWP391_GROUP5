package com.hiremate.service;

import com.hiremate.dto.response.UserSessionDTO;
import com.hiremate.entity.User;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface UserSessionService {

    void recordSession(Long userId, String token, String refreshToken, HttpServletRequest request);

    void recordSession(Long userId, String token, String refreshToken, String userAgent, String clientIp);

    List<UserSessionDTO> getUserSessions(User user, String currentToken);

    void touchSession(String token);

    void recordOrTouchSession(Long userId, String token, HttpServletRequest request);

    void revokeSession(User user, String sessionId);

    void revokeAllOtherSessions(User user, String currentToken);
}
