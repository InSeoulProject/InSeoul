package kr.inseoul.api;

import kr.inseoul.api.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class InseoulApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(InseoulApiApplication.class, args);
    }
}
