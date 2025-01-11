-- バージョン情報テーブルの作成
CREATE TABLE versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_major_version BOOLEAN DEFAULT FALSE,
    is_auto_save BOOLEAN DEFAULT FALSE,
    parent_version_id UUID REFERENCES versions(id),
    
    UNIQUE(project_id, version_number)
);

-- 差分データテーブルの作成
CREATE TABLE version_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    subtitle_id UUID NOT NULL REFERENCES subtitles(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ロールバックポイントテーブルの作成
CREATE TABLE rollback_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_auto_generated BOOLEAN DEFAULT FALSE
);

-- インデックスの作成
CREATE INDEX idx_versions_project ON versions(project_id);
CREATE INDEX idx_versions_created_by ON versions(created_by);
CREATE INDEX idx_version_changes_version ON version_changes(version_id);
CREATE INDEX idx_version_changes_subtitle ON version_changes(subtitle_id);
CREATE INDEX idx_rollback_points_project ON rollback_points(project_id);
CREATE INDEX idx_rollback_points_version ON rollback_points(version_id);

-- RLSポリシーの設定
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollback_points ENABLE ROW LEVEL SECURITY;

-- バージョンのRLSポリシー
CREATE POLICY "Users can view versions of their projects"
    ON versions FOR SELECT
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

CREATE POLICY "Users can create versions in their projects"
    ON versions FOR INSERT
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

-- 差分データのRLSポリシー
CREATE POLICY "Users can view version changes of their projects"
    ON version_changes FOR SELECT
    USING (
        version_id IN (
            SELECT id FROM versions 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "System can create version changes"
    ON version_changes FOR INSERT
    WITH CHECK (true);

-- ロールバックポイントのRLSポリシー
CREATE POLICY "Users can view rollback points of their projects"
    ON rollback_points FOR SELECT
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

CREATE POLICY "Users can manage rollback points in their projects"
    ON rollback_points FOR ALL
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