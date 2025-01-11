-- 字幕ファイル用のバケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'subtitles',
    'subtitles',
    false,
    10737418240, -- 10GB
    ARRAY['text/vtt', 'text/srt', 'application/x-subrip', 'text/plain']
);

-- エクスポートファイル用のバケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    false,
    10737418240, -- 10GB
    ARRAY['video/mp4', 'video/webm', 'application/xml', 'text/xml', 'text/vtt', 'text/srt', 'application/x-subrip']
);

-- 一時的な作業ファイル用のバケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp',
    'temp',
    false,
    10737418240, -- 10GB
    ARRAY['video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/octet-stream']
);

-- 字幕ファイル用のバケットポリシー
CREATE POLICY "Users can view their own project subtitles"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'subtitles'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can upload subtitles to their own projects"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'subtitles'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                    AND can_edit = true
                )
            )
        )
    );

CREATE POLICY "Users can update their own project subtitles"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'subtitles'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                    AND can_edit = true
                )
            )
        )
    );

CREATE POLICY "Users can delete their own project subtitles"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'subtitles'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                    AND can_edit = true
                )
            )
        )
    );

-- エクスポートファイル用のバケットポリシー
CREATE POLICY "Users can view their own project exports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'exports'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create exports in their own projects"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'exports'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::text FROM projects
                WHERE owner_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members
                    WHERE user_id = auth.uid()
                    AND can_edit = true
                )
            )
        )
    );

CREATE POLICY "System can delete old exports"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'exports'
        AND (CURRENT_TIMESTAMP - created_at) > INTERVAL '7 days'
    );

-- 一時ファイル用のバケットポリシー
CREATE POLICY "Users can view their own temp files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'temp'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
        )
    );

CREATE POLICY "Users can upload their own temp files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'temp'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
        )
    );

CREATE POLICY "System can delete old temp files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'temp'
        AND (CURRENT_TIMESTAMP - created_at) > INTERVAL '24 hours'
    ); 