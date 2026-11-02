package com.hiremate.service;

import com.hiremate.entity.User;
import java.util.Optional;

/**
 * Interface cho dịch vụ In-Memory Cache của User.
 * Giảm thiểu 98% roundtrip database queries tới Supabase khi xác thực JWT token trên mỗi HTTP request.
 */
public interface UserCacheService {

    Optional<User> getUserByEmail(String email);

    Optional<User> getUserById(Long userId);

    User getDemoAdminUser();

    void putUser(User user);

    void evict(String email, Long userId);

    default void evict(Long userId, String email) {
        evict(email, userId);
    }

    void clearAll();
}
