-- InSeoul 초기 스키마 (MySQL 8) — ERD(04) 기준.
-- 모든 사용자 데이터는 user_id(또는 simulation_id→user_id) 기준 격리(NFR-02). 비밀번호 해시(NFR-01).
-- Flyway 활성화 시 적용 (build.gradle 의 flyway/mysql 의존성 주석 해제 후).

CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(100) NOT NULL,
  provider      VARCHAR(30)  NOT NULL DEFAULT 'local',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE,
  cash_asset      DECIMAL(15,0),
  jeonse_deposit  DECIMAL(15,0),
  monthly_saving  DECIMAL(15,0),
  annual_income   DECIMAL(15,0),
  first_home_buyer BOOLEAN,
  marital_status  VARCHAR(20),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE districts (
  id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL DEFAULT '서울특별시'
);

CREATE TABLE district_prices (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  district_id   BIGINT NOT NULL,
  average_price DECIMAL(15,0) NOT NULL,
  jeonse_price  DECIMAL(15,0),
  housing_type  VARCHAR(30) NOT NULL DEFAULT 'apartment',
  base_date     DATE NOT NULL,
  CONSTRAINT fk_price_district FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE loan_products (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  max_house_price DECIMAL(15,0) NOT NULL,
  max_income      DECIMAL(15,0) NOT NULL,
  ltv             DECIMAL(4,3) NOT NULL,
  description     TEXT
);

CREATE TABLE simulations (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT NOT NULL,
  district_id          BIGINT,
  cash_asset           DECIMAL(15,0) NOT NULL,
  jeonse_deposit       DECIMAL(15,0) NOT NULL,
  monthly_saving       DECIMAL(15,0) NOT NULL,
  annual_income        DECIMAL(15,0),
  target_price         DECIMAL(15,0) NOT NULL,
  ltv                  DECIMAL(4,3) NOT NULL,
  interest_rate        DECIMAL(6,4) NOT NULL,
  expected_growth_rate DECIMAL(6,4) NOT NULL,
  d_day_months         INT NOT NULL,
  required_capital     DECIMAL(15,0) NOT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sim_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sim_district FOREIGN KEY (district_id) REFERENCES districts(id),
  INDEX idx_sim_user (user_id)
);

CREATE TABLE stress_test_results (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  simulation_id       BIGINT NOT NULL,
  scenario_type       VARCHAR(30) NOT NULL,
  changed_value       DECIMAL(15,4),
  delayed_months      INT NOT NULL,
  result_d_day_months INT NOT NULL,
  CONSTRAINT fk_stress_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

CREATE TABLE loan_eligibility_results (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  simulation_id   BIGINT NOT NULL,
  loan_product_id BIGINT NOT NULL,
  status          VARCHAR(20) NOT NULL,
  reason          TEXT,
  CONSTRAINT fk_loan_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
  CONSTRAINT fk_loan_product FOREIGN KEY (loan_product_id) REFERENCES loan_products(id)
);

CREATE TABLE strategy_cards (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  simulation_id BIGINT NOT NULL,
  summary       TEXT,
  action_items  TEXT,
  risk_notes    TEXT,
  disclaimer    TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_card_sim FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);
