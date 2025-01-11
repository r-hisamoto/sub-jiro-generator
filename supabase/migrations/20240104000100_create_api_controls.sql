-- APIキー管理テーブルの作成
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    rate_limit INTEGER NOT NULL DEFAULT 1000, -- 1時間あたりのリクエスト数
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- APIリクエスト履歴テーブルの作成
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_requests_api_key ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_created_at ON api_requests(created_at);

-- RLSポリシーの設定
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- APIキーのRLSポリシー
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
    ON api_keys FOR DELETE
    USING (user_id = auth.uid());

-- APIリクエスト履歴のRLSポリシー
CREATE POLICY "Users can view their own API request history"
    ON api_requests FOR SELECT
    USING (
        api_key_id IN (
            SELECT id FROM api_keys
            WHERE user_id = auth.uid()
        )
    );

-- レート制限チェック関数
CREATE OR REPLACE FUNCTION check_rate_limit(api_key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rate_limit INTEGER;
    current_count INTEGER;
BEGIN
    -- APIキーのレート制限を取得
    SELECT rate_limit INTO rate_limit
    FROM api_keys
    WHERE id = api_key_id AND is_active = TRUE;

    -- 直近1時間のリクエスト数をカウント
    SELECT COUNT(*) INTO current_count
    FROM api_requests
    WHERE api_key_id = api_key_id
    AND created_at > NOW() - INTERVAL '1 hour';

    -- レート制限チェック
    RETURN current_count < rate_limit;
END;
$$ LANGUAGE plpgsql;

-- APIキー検証関数
CREATE OR REPLACE FUNCTION verify_api_key(key_hash TEXT, required_scope TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    api_key_id UUID;
BEGIN
    -- APIキーの検証
    SELECT id INTO api_key_id
    FROM api_keys
    WHERE key_hash = key_hash
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (required_scope IS NULL OR required_scope = ANY(scopes));

    IF api_key_id IS NULL THEN
        RAISE EXCEPTION 'Invalid API key or insufficient permissions';
    END IF;

    -- レート制限チェック
    IF NOT check_rate_limit(api_key_id) THEN
        RAISE EXCEPTION 'Rate limit exceeded';
    END IF;

    -- 最終使用時刻の更新
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE id = api_key_id;

    RETURN api_key_id;
END;
$$ LANGUAGE plpgsql; 