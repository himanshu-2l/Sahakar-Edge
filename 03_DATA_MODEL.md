# Data Model

Use UUIDs for distributed entities/events.

## Core entities

### Institute

-   id
-   name
-   code
-   type
-   location_text
-   active

### User

-   id
-   name
-   email/phone
-   role
-   institute_id
-   preferred_language
-   active

### TraineeProfile

-   user_id
-   cooperative_affiliation
-   district/state
-   skills_summary
-   consent flags

### TrainerProfile

-   user_id
-   designation

### Programme

-   id
-   institute_id
-   title
-   description
-   start_at
-   end_at
-   status

### Batch

-   id
-   programme_id
-   capacity
-   trainer_id

### TrainingSession

-   id
-   batch_id
-   title
-   starts_at
-   ends_at
-   attendance_policy

### Course

-   id
-   title
-   version
-   language
-   description

### Module

-   id
-   course_id
-   title
-   order

### Lesson

-   id
-   module_id
-   type
-   title
-   content_uri/local_asset_ref
-   order

### Enrollment

-   id
-   trainee_id
-   programme_id
-   batch_id
-   status

### AttendanceEvent

-   id
-   session_id
-   trainee_id
-   node_id
-   method
-   result
-   confidence nullable
-   quality nullable
-   occurred_at
-   created_by
-   override_reason nullable

### LearningProgressEvent

-   id
-   trainee_id
-   lesson_id
-   event_type
-   value
-   occurred_at
-   node_id

### Assessment

-   id
-   course_id
-   title
-   passing_score

### Question

-   id
-   assessment_id
-   type
-   prompt
-   options
-   correct_answer / rubric

### AssessmentSubmission

-   id
-   assessment_id
-   trainee_id
-   answers
-   score
-   passed
-   occurred_at
-   node_id

### Skill

-   id
-   code
-   name
-   description
-   parent_skill_id nullable

### CourseSkill

-   course_id
-   skill_id
-   evidence_rule

### SkillEvidence

-   id
-   trainee_id
-   skill_id
-   source_type
-   source_id
-   level
-   issued_at

### Credential

-   id
-   trainee_id
-   programme_id
-   payload
-   signature
-   issuer_key_id
-   status
-   issued_at
-   expires_at nullable

### JobOpportunity

-   id
-   employer_id
-   title
-   description
-   location
-   qualification
-   experience
-   active

### JobRequiredSkill

-   job_id
-   skill_id
-   required_level
-   weight

### EdgeNode

-   id
-   institute_id
-   name
-   public_key
-   software_version
-   last_seen_at
-   health_status

### SyncEvent

-   id
-   node_id
-   aggregate_type
-   aggregate_id
-   event_type
-   payload
-   schema_version
-   occurred_at
-   logical_sequence
-   hash
-   sync_status
-   retry_count

### AuditLog

-   id
-   actor_id
-   action
-   entity_type
-   entity_id
-   metadata
-   occurred_at

## Important constraints

-   sync event IDs globally unique
-   central ingestion idempotent by event ID
-   attendance unique policy configurable per trainee/session
-   audit all manual attendance overrides
-   credentials immutable after issuance; revocation creates
    status/event, not mutation of historical payload
