package kr.inseoul.api.common.exception;

import org.springframework.http.HttpStatus;

public class AiUnavailableException extends BusinessException {
    public AiUnavailableException() {
        super("AI_UNAVAILABLE", "AI 서비스를 일시적으로 사용할 수 없습니다.", HttpStatus.SERVICE_UNAVAILABLE);
    }
}
