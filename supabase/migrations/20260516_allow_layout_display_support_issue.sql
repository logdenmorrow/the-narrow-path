begin;

alter table public.support_requests
  drop constraint if exists support_requests_issue_type_check;

alter table public.support_requests
  add constraint support_requests_issue_type_check
  check (
    issue_type in (
      'bug',
      'layout_display_issue',
      'confusing_behavior',
      'account_issue',
      'other'
    )
  );

commit;
