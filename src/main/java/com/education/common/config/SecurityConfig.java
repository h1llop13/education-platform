package com.education.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Бин для хеширования паролей (уже был)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // НОВЫЙ БИН: Настройка правил доступа к endpoints
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Отключаем CSRF для REST API (стандартная практика для stateless API)
                .csrf(csrf -> csrf.disable())

                // Настраиваем правила авторизации
                .authorizeHttpRequests(auth -> auth
                        // Разрешаем доступ к регистрации и входу без аутентификации
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Все остальные запросы требуют аутентификации
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}