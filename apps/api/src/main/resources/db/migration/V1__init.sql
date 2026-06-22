-- InSeoul 초기 스키마 (MySQL 8) — 가이드 9장.
-- 모든 사용자 생성 데이터는 user_id 기준으로 분리. 비밀번호는 해시 저장(평문 금지).
-- Flyway 활성화 시 적용됨 (build.gradle 의 flyway/mysql 의존성 주석 해제 후).

CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(100) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_profiles (
  user_id              BIGINT PRIMARY KEY,
  monthly_income       BIGINT,
  monthly_savings      BIGINT,
  current_assets       BIGINT,
  target_district_code VARCHAR(20),
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE districts (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE district_prices (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  district_code VARCHAR(20) NOT NULL,
  price         BIGINT NOT NULL,
  as_of         DATE NOT NULL,
  CONSTRAINT fk_price_district FOREIGN KEY (district_code) REFERENCES districts(code)
);

CREATE TABLE loan_products (
  code              VARCHAR(40) PRIMARY KEY,
  name              VARCHAR(200) NOT NULL,
  interest_rate_pct DECIMAL(5,2) NOT NULL,
  max_amount        BIGINT NOT NULL
);

CREATE TABLE simulations (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  d_day         INT NOT NULL,
  target_amount BIGINT NOT NULL,
  achieve_date  DATE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sim_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sim_user (user_id)
);

CREATE TABLE stress_test_results (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  simulation_id  BIGINT NOT NULL,
  adjusted_d_day INT NOT NULL,
  risk_level     VARCHAR(10) NOT NULL,
  notes          TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stress_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

CREATE TABLE loan_eligibility_results (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT NOT NULL,
  loan_product_code VARCHAR(40) NOT NULL,
  eligible          BOOLEAN NOT NULL,
  approved_amount   BIGINT,
  reason            TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_loan_product FOREIGN KEY (loan_product_code) REFERENCES loan_products(code)
);

CREATE TABLE strategy_cards (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  simulation_id BIGINT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  summary       TEXT,
  steps_json    JSON,
  is_fallback   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_card_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
  INDEX idx_card_user (user_id)
);
