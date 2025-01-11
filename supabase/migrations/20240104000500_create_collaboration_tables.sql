-- 編集履歴テーブルの作成
CREATE TABLE edit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subtitle_id UUID REFERENCES subtitles(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- コメントテーブルの作成
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subtitle_id UUID REFERENCES subtitles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT FALSE
);

-- 通知テーブルの作成
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('comment', 'mention', 'edit', 'share', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_edit_history_project ON edit_history(project_id);
CREATE INDEX idx_edit_history_subtitle ON edit_history(subtitle_id);
CREATE INDEX idx_edit_history_user ON edit_history(user_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_subtitle ON comments(subtitle_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_project ON notifications(project_id);

-- RLSポリシーの設定
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 編集履歴のRLSポリシー
CREATE POLICY "Users can view edit history of their projects"
    ON edit_history FOR SELECT
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

CREATE POLICY "System can insert edit history"
    ON edit_history FOR INSERT
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

-- コメントのRLSポリシー
CREATE POLICY "Users can view comments in their projects"
    ON comments FOR SELECT
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

CREATE POLICY "Users can manage their own comments"
    ON comments FOR ALL
    USING (user_id = auth.uid());

-- 通知のRLSポリシー
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 