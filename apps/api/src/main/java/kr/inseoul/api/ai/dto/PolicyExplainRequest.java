package kr.inseoul.api.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record PolicyExplainRequest(
        @NotBlank String loanName,
        @NotBlank String status
) {}
