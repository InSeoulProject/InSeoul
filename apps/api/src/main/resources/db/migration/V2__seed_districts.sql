-- 서울특별시 25개 자치구 기본 데이터
INSERT INTO districts (code, name, city) VALUES
('11110', '종로구',   '서울특별시'),
('11140', '중구',     '서울특별시'),
('11170', '용산구',   '서울특별시'),
('11200', '성동구',   '서울특별시'),
('11215', '광진구',   '서울특별시'),
('11230', '동대문구', '서울특별시'),
('11260', '중랑구',   '서울특별시'),
('11290', '성북구',   '서울특별시'),
('11305', '강북구',   '서울특별시'),
('11320', '도봉구',   '서울특별시'),
('11350', '노원구',   '서울특별시'),
('11380', '은평구',   '서울특별시'),
('11410', '서대문구', '서울특별시'),
('11440', '마포구',   '서울특별시'),
('11470', '양천구',   '서울특별시'),
('11500', '강서구',   '서울특별시'),
('11530', '구로구',   '서울특별시'),
('11545', '금천구',   '서울특별시'),
('11560', '영등포구', '서울특별시'),
('11590', '동작구',   '서울특별시'),
('11620', '관악구',   '서울특별시'),
('11650', '서초구',   '서울특별시'),
('11680', '강남구',   '서울특별시'),
('11710', '송파구',   '서울특별시'),
('11740', '강동구',   '서울특별시');

-- 자치구별 대표 아파트 시세 (2026-06-01 기준, 단위: 원)
INSERT INTO district_prices (district_id, average_price, jeonse_price, housing_type, base_date)
SELECT id, 650000000,  520000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11110' -- 종로구
UNION ALL
SELECT id, 700000000,  560000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11140' -- 중구
UNION ALL
SELECT id, 1000000000, 750000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11170' -- 용산구
UNION ALL
SELECT id, 1100000000, 820000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11200' -- 성동구
UNION ALL
SELECT id, 800000000,  620000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11215' -- 광진구
UNION ALL
SELECT id, 550000000,  440000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11230' -- 동대문구
UNION ALL
SELECT id, 480000000,  390000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11260' -- 중랑구
UNION ALL
SELECT id, 600000000,  480000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11290' -- 성북구
UNION ALL
SELECT id, 450000000,  360000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11305' -- 강북구
UNION ALL
SELECT id, 480000000,  385000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11320' -- 도봉구
UNION ALL
SELECT id, 500000000,  400000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11350' -- 노원구
UNION ALL
SELECT id, 550000000,  440000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11380' -- 은평구
UNION ALL
SELECT id, 620000000,  500000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11410' -- 서대문구
UNION ALL
SELECT id, 900000000,  680000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11440' -- 마포구
UNION ALL
SELECT id, 650000000,  520000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11470' -- 양천구
UNION ALL
SELECT id, 650000000,  520000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11500' -- 강서구
UNION ALL
SELECT id, 520000000,  420000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11530' -- 구로구
UNION ALL
SELECT id, 470000000,  380000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11545' -- 금천구
UNION ALL
SELECT id, 750000000,  600000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11560' -- 영등포구
UNION ALL
SELECT id, 700000000,  560000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11590' -- 동작구
UNION ALL
SELECT id, 580000000,  465000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11620' -- 관악구
UNION ALL
SELECT id, 1500000000, 1050000000, 'apartment', '2026-06-01' FROM districts WHERE code = '11650' -- 서초구
UNION ALL
SELECT id, 2000000000, 1350000000, 'apartment', '2026-06-01' FROM districts WHERE code = '11680' -- 강남구
UNION ALL
SELECT id, 1200000000, 840000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11710' -- 송파구
UNION ALL
SELECT id, 800000000,  620000000,  'apartment', '2026-06-01' FROM districts WHERE code = '11740'; -- 강동구
