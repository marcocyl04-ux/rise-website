-- Convert food_database name_zh from Simplified to Traditional Chinese
-- Applied character by character via nested REPLACE

-- First, verify current state
SELECT COUNT(*) AS total_items FROM food_database;

-- Preview items that will change (items containing known simplified chars)
SELECT id, name, name_zh FROM food_database 
WHERE name_zh ~ '[鸡鱼虾猪烧鹅鸭鱿饭面无浆装冻柠麦罗烟华肠乌龙凤鲭鲈鳕鸽贝释云腊饺汤饼饮萝卖杂维运动卷萨寿酿咸干松热狮馒窝头农]'
ORDER BY name;

-- ================================================================
-- APPLY CONVERSION
-- ================================================================
-- Multi-character phrases first (to avoid partial replacement issues)
-- Then individual characters in order
-- ================================================================

UPDATE food_database SET name_zh = 
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(name_zh,
  -- Multi-char phrases
  '萝卜', '蘿蔔'),
  -- Individual chars
  '鸡', '雞'),
  '鱼', '魚'),
  '虾', '蝦'),
  '猪', '豬'),
  '烧', '燒'),
  '鹅', '鵝'),
  '鸭', '鴨'),
  '鱿', '魷'),
  '饭', '飯'),
  '面', '麵'),
  '无', '無'),
  '浆', '漿'),
  '装', '裝'),
  '冻', '凍'),
  '柠', '檸'),
  '麦', '麥'),
  '罗', '羅'),
  '烟', '煙'),
  '华', '華'),
  '肠', '腸'),
  '乌', '烏'),
  '龙', '龍'),
  '凤', '鳳'),
  '鲭', '鯖'),
  '鲈', '鱸'),
  '鳕', '鱈'),
  '鸽', '鴿'),
  '贝', '貝'),
  '释', '釋'),
  '云', '雲'),
  '腊', '臘'),
  '饺', '餃'),
  '汤', '湯'),
  '饼', '餅'),
  '饮', '飲'),
  '萝', '蘿'),
  '卖', '賣'),
  '杂', '雜'),
  '维', '維'),
  '运', '運'),
  '动', '動'),
  '卷', '捲'),
  '萨', '薩'),
  '寿', '壽'),
  '酿', '釀'),
  '咸', '鹹'),
  '干', '乾'),
  '松', '鬆'),
  '热', '熱'),
  '狮', '獅'),
  '馒', '饅'),
  '窝', '窩'),
  '头', '頭'),
  '农', '農')
WHERE name_zh ~ '[鸡鱼虾猪烧鹅鸭鱿饭面无浆装冻柠麦罗烟华肠乌龙凤鲭鲈鳕鸽贝释云腊饺汤饼饮萝卖杂维运动卷萨寿酿咸干松热狮馒窝头农]';

-- Verify results
SELECT id, name, name_zh FROM food_database ORDER BY name;
