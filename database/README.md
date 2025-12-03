# Secret Santa Database Documentation

## Database Overview

This MySQL database schema is designed for a Secret Santa gift exchange application with support for multiple parties, participant management, gift assignments, notifications, and audit logging.

---

## Tables

### 1. **parties** - Main Party Information
Stores the core information about each Secret Santa party.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) | UUID primary key |
| `status` | ENUM | Party status: created, pending, active, completed, cancelled |
| `party_date` | DATE | Optional party date |
| `location` | VARCHAR(255) | Optional party location |
| `max_amount` | DECIMAL(10,2) | Optional maximum gift amount |
| `personal_message` | TEXT | Host's message to all participants |
| `host_can_see_all` | BOOLEAN | Whether host can view all assignments |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_status` - For filtering parties by status
- `idx_created_at` - For chronological queries

---

### 2. **participants** - Party Participants
Stores information about each person participating in a party.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `party_id` | CHAR(36) | Foreign key to parties table |
| `name` | VARCHAR(255) | Participant's name |
| `email` | VARCHAR(255) | Participant's email (unique per party) |
| `is_host` | BOOLEAN | Whether this participant is the party host |
| `assigned_to` | BIGINT UNSIGNED | ID of participant they're giving gift to |
| `wishlist` | TEXT | Optional wishlist (deprecated, use wishlists table) |
| `notification_sent` | BOOLEAN | Whether notification email was sent |
| `notification_sent_at` | TIMESTAMP | When notification was sent |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_party_id` - For party-specific queries
- `idx_email` - For email lookups
- `idx_is_host` - For finding hosts
- `idx_party_email` (UNIQUE) - Ensures unique emails per party

**Foreign Keys:**
- `party_id` → `parties(id)` CASCADE DELETE
- `assigned_to` → `participants(id)` SET NULL

---

### 3. **assignments** - Gift Assignments
Tracks who gives gifts to whom (separate table for data integrity).

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `party_id` | CHAR(36) | Foreign key to parties table |
| `giver_id` | BIGINT UNSIGNED | Participant giving the gift |
| `receiver_id` | BIGINT UNSIGNED | Participant receiving the gift |
| `created_at` | TIMESTAMP | Assignment creation time |

**Indexes:**
- `idx_giver` (UNIQUE) - One giver per party can only give to one person
- `idx_receiver` - For finding who is giving to someone

**Foreign Keys:**
- `party_id` → `parties(id)` CASCADE DELETE
- `giver_id` → `participants(id)` CASCADE DELETE
- `receiver_id` → `participants(id)` CASCADE DELETE

---

### 4. **notifications** - Email Notification Tracking
Logs all email notifications sent to participants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `party_id` | CHAR(36) | Foreign key to parties table |
| `participant_id` | BIGINT UNSIGNED | Recipient participant |
| `type` | ENUM | invitation, reminder, assignment, update |
| `status` | ENUM | pending, sent, failed, bounced |
| `subject` | VARCHAR(255) | Email subject line |
| `sent_at` | TIMESTAMP | When email was sent |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMP | Record creation time |

**Indexes:**
- `idx_party_id` - For party-specific queries
- `idx_participant_id` - For participant-specific queries
- `idx_status` - For filtering by status
- `idx_type` - For filtering by notification type

---

### 5. **party_settings** - Additional Party Settings
Key-value store for flexible party configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `party_id` | CHAR(36) | Foreign key to parties table |
| `setting_key` | VARCHAR(100) | Setting name |
| `setting_value` | TEXT | Setting value (JSON supported) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_party_setting` (UNIQUE) - One key per party

**Example Settings:**
- `theme_color`: `"#b71f29"`
- `allow_wishlist_edits`: `"true"`
- `reveal_date`: `"2025-12-25"`

---

### 6. **wishlists** - Participant Wishlists
Structured wishlist items for participants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `participant_id` | BIGINT UNSIGNED | Foreign key to participants |
| `item_name` | VARCHAR(255) | Wishlist item name |
| `item_description` | TEXT | Optional description |
| `item_url` | VARCHAR(500) | Optional product URL |
| `price_range` | VARCHAR(50) | Optional price range (e.g., "$20-30") |
| `priority` | ENUM | high, medium, low |
| `is_purchased` | BOOLEAN | Whether item was purchased |
| `sort_order` | INT | Display order |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_participant_id` - For participant-specific queries
- `idx_priority` - For sorting by priority

---

### 7. **audit_logs** - Security and Activity Tracking
Tracks important actions for security and debugging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED | Auto-increment primary key |
| `party_id` | CHAR(36) | Optional party reference |
| `participant_id` | BIGINT UNSIGNED | Optional participant reference |
| `action` | VARCHAR(100) | Action performed (e.g., "party_created") |
| `details` | JSON | Additional action details |
| `ip_address` | VARCHAR(45) | Client IP address (IPv6 supported) |
| `user_agent` | TEXT | Client user agent |
| `created_at` | TIMESTAMP | Action timestamp |

**Indexes:**
- `idx_party_id` - For party-specific logs
- `idx_action` - For filtering by action type
- `idx_created_at` - For chronological queries

**Example Actions:**
- `party_created`
- `participant_added`
- `assignment_viewed`
- `wishlist_updated`

---

## Relationships Diagram

```
parties (1) ──────< (N) participants
                         │
                         ├──< (N) wishlists
                         └──< (N) notifications

parties (1) ──────< (N) assignments
                         ├──> (1) giver (participants)
                         └──> (1) receiver (participants)

parties (1) ──────< (N) party_settings
parties (1) ──────< (N) audit_logs
```

---

## Key Features

### 1. **UUID for Parties**
- Parties use UUID (`CHAR(36)`) instead of auto-increment
- Better for distributed systems and public URLs
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 2. **Cascade Deletes**
- Deleting a party removes all related data automatically
- Participants, assignments, notifications, settings all cascade

### 3. **Unique Email Constraint**
- `UNIQUE INDEX idx_party_email (party_id, email)`
- Ensures no duplicate emails within the same party
- Same email can participate in different parties

### 4. **Assignment Integrity**
- Separate `assignments` table prevents data inconsistencies
- Foreign keys ensure participants exist
- Unique constraint ensures one gift per giver

### 5. **Notification Tracking**
- Complete email delivery tracking
- Retry logic possible with `status` field
- Error logging for debugging

### 6. **Flexible Settings**
- Key-value store allows adding new features without schema changes
- JSON support for complex configurations

### 7. **Audit Trail**
- Complete activity logging
- IP and user agent tracking for security
- JSON details field for extensibility

---

## Sample Queries

### Create a Party:
```sql
INSERT INTO parties (id, status, party_date, location, max_amount, personal_message, host_can_see_all)
VALUES (UUID(), 'created', '2025-12-25', 'Office', 50.00, 'Happy Holidays!', FALSE);
```

### Add Participants:
```sql
INSERT INTO participants (party_id, name, email, is_host)
VALUES 
  ('party-uuid', 'John Doe', 'john@example.com', TRUE),
  ('party-uuid', 'Jane Smith', 'jane@example.com', FALSE);
```

### Get All Participants for a Party:
```sql
SELECT * FROM participants 
WHERE party_id = 'party-uuid' 
ORDER BY is_host DESC, name ASC;
```

### Get Assignment for a Participant:
```sql
SELECT 
  p1.name AS giver_name,
  p2.name AS receiver_name,
  p2.email AS receiver_email
FROM assignments a
JOIN participants p1 ON a.giver_id = p1.id
JOIN participants p2 ON a.receiver_id = p2.id
WHERE a.party_id = 'party-uuid' AND a.giver_id = 123;
```

### Check Email Uniqueness:
```sql
SELECT COUNT(*) FROM participants 
WHERE party_id = 'party-uuid' AND email = 'test@example.com';
```

---

## Indexes for Performance

All tables have appropriate indexes for common query patterns:

- **Primary Keys**: Fast lookups by ID
- **Foreign Keys**: Automatic indexing for joins
- **Status Fields**: Fast filtering
- **Timestamps**: Chronological sorting
- **Composite Indexes**: Multi-column queries

---

## Scalability Considerations

1. **Partitioning**: `audit_logs` can be partitioned by date
2. **Archiving**: Old completed parties can be archived
3. **Read Replicas**: Use for reporting queries
4. **Caching**: Party data rarely changes, cache aggressively
5. **Connection Pooling**: Use for Node.js connections

---

## Migration Strategy

For production deployment:

1. Run `schema.sql` to create all tables
2. Create indexes (included in schema)
3. Set up foreign key constraints
4. Configure MySQL user permissions
5. Enable binary logging for backups
6. Set up automated backups

---

## Security Best Practices

1. **Parameterized Queries**: Prevent SQL injection
2. **Least Privilege**: Database user with minimal permissions
3. **Encryption**: Use TLS for database connections
4. **Audit Logs**: Monitor suspicious activity
5. **Rate Limiting**: Prevent abuse
6. **Input Validation**: Validate on backend before DB

---

This schema provides a solid foundation for your Secret Santa application with room for future enhancements! 🎄

