package com.example.PBL5.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${ai.storage.path}")
    private String storagePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình để phục vụ các file ảnh từ thư mục storage của AI
        // Khi truy cập /ai-images/** nó sẽ map vào thư mục thực tế
        registry.addResourceHandler("/ai-images/**")
                .addResourceLocations("file:" + storagePath + "/");
    }
}
