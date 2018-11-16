with base as (
    select 
    user_id || '-' || domain_sessionidx as session_id,
    collector_tstamp,
    domain_sessionid, 
    event_id,
    se_action as event_action,
    se_category as event_category,
    json_extract_path_text(se_property, 'featureType', true) as feature
    from analytics.sp_events_xf
    where event = 'se'
)

, valid_session as (
    select
    session_id as domain_sessionid
    from analytics.snowplow_sessions
    where not user_bounced
)

-- , events as (
--     select 
--     *, 
--     last_value(event_id) over (partition by session_id order by collector_tstamp rows between current row and 1 following)
--     from base
--     join valid_session using (domain_sessionid)
-- )  

, events as (
    select 
    *, 
    row_number() over (partition by session_id order by collector_tstamp) as event_idx
    from base
    join valid_session using (domain_sessionid)
)  

, events_join as (
    select
    a.*, 
    b.event_id as next_event_id,
    b.event_idx as next_event_idx, 
    b.event_action as next_event_action, 
    b.event_category as next_event_category, 
    b.feature as next_feature
    from events a
    left join events b
        on a.session_id = b.session_id 
        and a.event_idx + 1 = b.event_idx
)

, sumup as (
    select
    event_category, 
    next_event_category, 
    count(*) as freq
    from events_join 
    where date(collector_tstamp) >= '2018-11-01'
        and event_category != next_event_category
        and event_category is not null
        and next_event_category is not null
    group by 1, 2
)

select 
*,
max(freq) over (partition by event_category) as  max_freq,
1.0 * freq / max(freq) over (partition by event_category) as weight
from sumup 