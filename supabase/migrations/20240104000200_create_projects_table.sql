-- プロジェクト管理テーブルの作成
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- プロジェクト設定
    default_font_family TEXT DEFAULT 'Arial',
    default_font_size INTEGER DEFAULT 20,
    default_font_color TEXT DEFAULT '#FFFFFF',
    default_background_color TEXT DEFAULT '#000000',
    
    -- メタデータ
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_public BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    
    -- ファイル情報
    video_url TEXT,
    video_duration NUMERIC,
    video_format TEXT,
    
    -- プロジェクト設定
    auto_save BOOLEAN DEFAULT TRUE,
    auto_backup BOOLEAN DEFAULT TRUE,
    enable_collaboration BOOLEAN DEFAULT TRUE
);

-- プロジェクトメンバーテーブルの作成
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (project_id, user_id)
);

-- インデックスの作成
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- RLSポリシーの設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- プロジェクトのRLSポリシー
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        OR is_public = TRUE
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Owners can update their own projects"
    ON projects FOR UPDATE
    USING (owner_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (owner_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Owners can delete their own projects"
    ON projects FOR DELETE
    USING (owner_id = auth.uid() OR auth.role() = 'service_role');

-- プロジェクトメンバーのRLSポリシー
CREATE POLICY "Project owners and admins can view members"
    ON project_members FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Project owners and admins can manage members"
    ON project_members FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
        OR (
            project_id IN (
                SELECT project_id FROM project_members
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
        OR auth.role() = 'service_role'
    );

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 