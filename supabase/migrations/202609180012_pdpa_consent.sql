-- Records acceptance of the Personal Data Protection Notice (Malaysia PDPA
-- 2010) that's shown before a worker/team-leader/owner signs in. Written
-- once, the first time each account accepts (see Login.tsx) — an audit
-- trail of consent, not a re-prompt gate (that's handled client-side).
alter table profiles add column pdpa_accepted_at timestamptz;
