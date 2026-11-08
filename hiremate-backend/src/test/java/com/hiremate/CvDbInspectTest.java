package com.hiremate;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testng.annotations.Test;
import java.util.List;
import java.util.Map;

@SpringBootTest
public class CvDbInspectTest extends org.springframework.test.context.testng.AbstractTestNGSpringContextTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void inspectCvsAndApps() {
        System.out.println("=== ALL CVS IN DB ===");
        List<Map<String, Object>> cvs = jdbcTemplate.queryForList(
                "SELECT cv_id, candidate_id, file_name, file_url, is_default, created_at FROM cvs ORDER BY cv_id ASC");
        for (Map<String, Object> r : cvs) {
            System.out.println(r);
        }

        System.out.println("=== ALL APPLICATIONS ===");
        List<Map<String, Object>> apps = jdbcTemplate.queryForList(
                "SELECT application_id, job_id, candidate_id, cv_id, status, created_at FROM applications ORDER BY application_id ASC");
        for (Map<String, Object> r : apps) {
            System.out.println(r);
        }
    }
}
