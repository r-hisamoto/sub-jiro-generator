-- バックアップ設定テーブルの作成
CREATE TABLE backup_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('database', 'storage', 'full')),
    schedule TEXT NOT NULL, -- CRONフォーマット
    retention_days INTEGER NOT NULL DEFAULT 30,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_backup_at TIMESTAMPTZ,
    next_backup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- バックアップ履歴テーブルの作成
CREATE TABLE backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID NOT NULL REFERENCES backup_settings(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    file_size BIGINT,
    file_path TEXT,
    error_message TEXT,
    metadata JSONB
);

-- リストアポイントテーブルの作成
CREATE TABLE restore_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_history_id UUID NOT NULL REFERENCES backup_history(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT
);

-- インデックスの作成
CREATE INDEX idx_backup_settings_type ON backup_settings(type);
CREATE INDEX idx_backup_history_setting ON backup_history(setting_id);
CREATE INDEX idx_backup_history_status ON backup_history(status);
CREATE INDEX idx_restore_points_backup ON restore_points(backup_history_id);

-- RLSポリシーの設定
ALTER TABLE backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_points ENABLE ROW LEVEL SECURITY;

-- バックアップ設定のRLSポリシー
CREATE POLICY "Only superadmins can manage backup settings"
    ON backup_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- バックアップ履歴のRLSポリシー
CREATE POLICY "Superadmins can view all backup history"
    ON backup_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- リストアポイントのRLSポリシー
CREATE POLICY "Superadmins can manage restore points"
    ON restore_points FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data->>'role' = 'superadmin'
        )
    );

-- バックアップ検証関数
CREATE OR REPLACE FUNCTION verify_backup(backup_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    backup_record backup_history;
    backup_file_exists BOOLEAN;
    backup_file_size BIGINT;
BEGIN
    -- バックアップ記録の取得
    SELECT * INTO backup_record
    FROM backup_history
    WHERE id = backup_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- ファイルの存在確認とサイズチェック
    -- 実際の実装ではストレージサービスのAPIを使用
    -- この例では簡略化
    backup_file_exists := TRUE;
    backup_file_size := backup_record.file_size;

    IF NOT backup_file_exists OR backup_file_size != backup_record.file_size THEN
        RETURN FALSE;
    END IF;

    -- バックアップの整合性チェック
    -- 実際の実装ではチェックサムの検証なども行う
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON backup_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- デフォルトのバックアップ設定を追加
INSERT INTO backup_settings (name, type, schedule, retention_days)
VALUES
    ('Daily Database Backup', 'database', '0 0 * * *', 7),
    ('Weekly Full Backup', 'full', '0 0 * * 0', 30),
    ('Monthly Storage Backup', 'storage', '0 0 1 * *', 90); 