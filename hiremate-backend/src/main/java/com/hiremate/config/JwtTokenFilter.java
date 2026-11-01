package com.hiremate.config;

import com.hiremate.entity.User;
import com.hiremate.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final com.hiremate.service.UserCacheService userCacheService;
    private final com.hiremate.service.TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String token = null;
        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else {
            String paramToken = request.getParameter("token");
            if (paramToken == null || paramToken.isBlank()) {
                paramToken = request.getParameter("access_token");
            }
            if (paramToken != null && !paramToken.isBlank()) {
                token = paramToken.trim();
            }
        }

        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Kiểm tra Token Blacklist (ngăn chặn token đã logout)
        if (tokenBlacklistService.isBlacklisted(token)) {
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        // Hỗ trợ demo-admin-token khi truy cập từ UI (sử dụng in-memory admin cache)
        if ("demo-admin-token".equals(token)) {
            User adminUser = userCacheService.getDemoAdminUser();
            if (adminUser != null) {
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_ADMIN");
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        adminUser,
                        null,
                        Collections.singletonList(authority)
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                filterChain.doFilter(request, response);
                return;
            }
        }

        try {
            final String userEmail = jwtUtil.extractEmail(token);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Tối ưu hóa: Truy vấn qua UserCacheService bộ nhớ đệm (0ms latency, không nghẽn connection pool)
                Optional<User> userOpt = userCacheService.getUserByEmail(userEmail);

                if (userOpt.isPresent() && jwtUtil.isTokenValid(token, userEmail)) {
                    User user = userOpt.get();
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            Collections.singletonList(authority)
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Invalid token - clear context
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
