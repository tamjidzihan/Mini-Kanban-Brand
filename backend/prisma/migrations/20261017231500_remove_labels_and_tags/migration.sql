DELETE FROM `ActivityLog`
WHERE `action` = 'TAG_ASSIGNED';

DROP TABLE `TaskTag`;
DROP TABLE `Tag`;
