-- CreateIndex
CREATE INDEX "live_sessions_status_scheduledAt_idx" ON "live_sessions"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "live_sessions_subject_idx" ON "live_sessions"("subject");

-- CreateIndex
CREATE INDEX "live_sessions_price_idx" ON "live_sessions"("price");

-- CreateIndex
CREATE INDEX "live_sessions_scheduledAt_idx" ON "live_sessions"("scheduledAt");
