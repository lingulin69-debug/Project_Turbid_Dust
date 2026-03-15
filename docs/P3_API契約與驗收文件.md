# 《白鴉之繭》P3 功能 — API 契約 & 端到端驗收文件

## 1. 褪色印記

### 1.1 獲取玩家褪色印記 (Get Player Faded Marks)

#### API 端點
`GET /api/user/faded-marks/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "oc_name": "string",
  "faded_marks": [          // 褪色印記 (舊標籤)
    {
      "tag_id": "string",
      "name": "string",
      "description": "string",
      "timestamp": "string" // 標籤被替換的時間
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

## 4. 旅店距離區間細化

### 4.1 獲取旅店救援距離設定 (Get Inn Rescue Distance Settings)

#### API 端點
`GET /api/inn/rescue-distance`

#### 請求 (Request)
*   此 API 無需請求參數。

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "rescue_distance_settings": [
    {
      "inn_landmark_id": "string", // 旅店據點 ID
      "distance_zones": [
        {
          "zone_name": "string",   // 區域名稱 (例如：近區據點)
          "landmark_ids": ["string"], // 該區域包含的據點 ID 列表
          "time_reduction_minutes": "number" // 縮短的失蹤時間 (分鐘)
        }
      ]
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息
}
```

#### 驗收標準
*   應返回 `src/data/rescue-distance.json` 中定義的旅店救援距離設定。
*   設定應包含旅店據點 ID、距離區域、區域包含的據點 ID 列表和縮短的失蹤時間。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取旅店救援距離設定
curl -X GET "http://localhost:3000/api/inn/rescue-distance"
```


## 2. 天平結算 Lottie 動畫

### 2.1 獲取天平結算結果 (Get Balance Settlement Result)

#### API 端點
`GET /api/balance/settlement-result`

#### 請求 (Request)
*   此 API 應透過查詢參數接收 `chapter_version`。
```
?chapter_version=string
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "chapter_version": "string",
  "final_balance_value": "number", // 最終天平值
  "winning_faction": "Turbid" | "Pure" | "Draw", // 獲勝陣營或平局
  "lottie_animation_data": "object" // Lottie 動畫所需的數據 (若有)
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：SETTLEMENT_NOT_AVAILABLE
}
```

## 3. 真結局遺物收集

### 3.1 獲取玩家遺物列表 (Get Player Relics)

#### API 端點
`GET /api/user/relics/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "oc_name": "string",
  "relics": [
    {
      "relic_id": "string",
      "name": "string",
      "description": "string",
      "image_url": "string"
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

#### 驗收標準
*   應返回指定玩家收集到的所有遺物列表。
*   每個遺物應包含 ID、名稱、描述和圖片 URL。
*   集齊「昔日的餘溫」全三件遺物後，應解鎖展示繭降臨前夕真相的無聲動畫。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取玩家遺物列表
curl -X GET "http://localhost:3000/api/user/relics/PlayerA"

# 測試玩家不存在
curl -X GET "http://localhost:3000/api/user/relics/NonExistentPlayer"
```


#### 驗收標準
*   應返回指定章節的天平結算結果，包括最終天平值和獲勝陣營。
*   若結算結果尚未生成，應返回 `SETTLEMENT_NOT_AVAILABLE` 錯誤。
*   前端應根據此結果播放 Lottie 動畫。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取天平結算結果
curl -X GET "http://localhost:3000/api/balance/settlement-result?chapter_version=1.0"
```


#### 驗收標準
*   應返回指定玩家的所有褪色印記。
*   每個褪色印記應包含標籤 ID、名稱、描述和被替換的時間。
*   在前端顯示時，應有灰色刪除線和 40% 透明度。
*   若玩家不存在，應返回 `USER_NOT_FOUND` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取玩家褪色印記
curl -X GET "http://localhost:3000/api/user/faded-marks/PlayerA"

# 測試玩家不存在
curl -X GET "http://localhost:3000/api/user/faded-marks/NonExistentPlayer"
```
