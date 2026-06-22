package kr.inseoul.api.ai;

import kr.inseoul.api.common.exception.AiUnavailableException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
public class AiClient {

    private final RestClient aiRestClient;

    public AiClient(RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

    public InternalStrategyCardResponse callStrategyCard(Map<String, Object> payload) {
        try {
            return aiRestClient.post()
                    .uri("/internal/ai/strategy-card")
                    .body(payload)
                    .retrieve()
                    .body(InternalStrategyCardResponse.class);
        } catch (RestClientException e) {
            throw new AiUnavailableException();
        }
    }

    public InternalPolicyExplainResponse callPolicyExplain(Map<String, Object> payload) {
        try {
            return aiRestClient.post()
                    .uri("/internal/ai/policy-explain")
                    .body(payload)
                    .retrieve()
                    .body(InternalPolicyExplainResponse.class);
        } catch (RestClientException e) {
            throw new AiUnavailableException();
        }
    }

    public boolean isHealthy() {
        try {
            Map<?, ?> response = aiRestClient.get()
                    .uri("/internal/ai/health")
                    .retrieve()
                    .body(Map.class);
            return response != null && Boolean.TRUE.equals(response.get("llmAvailable"));
        } catch (Exception e) {
            return false;
        }
    }

    public record InternalStrategyCardResponse(
            String summary,
            List<String> actionItems,
            List<String> riskNotes,
            String disclaimer
    ) {}

    public record InternalPolicyExplainResponse(
            String explanation,
            boolean isFallback
    ) {}
}
