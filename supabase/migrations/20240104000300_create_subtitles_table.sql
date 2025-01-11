-- 字幕データテーブルの作成
CREATE TABLE subtitles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    text TEXT NOT NULL,
    start_time NUMERIC NOT NULL, -- タイムコード（秒）
    end_time NUMERIC NOT NULL,   -- タイムコード（秒）
    line_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- スタイル設定
    font_family TEXT DEFAULT 'Arial',
    font_size INTEGER DEFAULT 20,
    font_color TEXT DEFAULT '#FFFFFF',
    background_color TEXT DEFAULT '#000000',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    
    -- メタデータ
    speaker TEXT,
    notes TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    
    CONSTRAINT valid_timerange CHECK (end_time > start_time)
);

-- インデックスの作成
CREATE INDEX idx_subtitles_project_id ON subtitles(project_id);
CREATE INDEX idx_subtitles_line_number ON subtitles(project_id, line_number);

-- RLSポリシーの設定
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー
CREATE POLICY "Users can view their own project subtitles"
    ON subtitles FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert subtitles to their own projects"
    ON subtitles FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
                AND can_edit = true
            )
        )
    );

CREATE POLICY "Users can update subtitles in their own projects"
    ON subtitles FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
                AND can_edit = true
            )
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
                AND can_edit = true
            )
        )
    );

CREATE POLICY "Users can delete subtitles in their own projects"
    ON subtitles FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
                AND can_edit = true
            )
        )
    );

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON subtitles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 