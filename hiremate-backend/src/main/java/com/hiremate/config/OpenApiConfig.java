package com.hiremate.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI hireMateOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HireMate AI - API Specification & Documentation")
                        .description("RESTful APIs for HireMate AI: AI-powered recruitment, automated CV matching, and AI mock interview platform.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("HireMate Team (FPT SWP391 Group 5)")
                                .email("hiremate.ai.fpt@gmail.com"))
                        .license(new License().name("Apache 2.0")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Access Token JWT (không cần gõ tiền tố 'Bearer ')")));
    }
}
