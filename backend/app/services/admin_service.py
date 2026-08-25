from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities_admin import ActivityLog, Permission, RolePermission, SystemConfig


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(
        self,
        username: str,
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> ActivityLog:
        """Log user activity for audit trail."""
        log = ActivityLog(
            user_id=user_id,
            username=username,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.commit()
        return log

    def get_activity_logs(
        self,
        limit: int = 100,
        username: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> list[ActivityLog]:
        """Get activity logs with optional filters."""
        query = select(ActivityLog).order_by(ActivityLog.timestamp.desc())
        
        if username:
            query = query.where(ActivityLog.username == username)
        if entity_type:
            query = query.where(ActivityLog.entity_type == entity_type)
            
        return self.db.scalars(query.limit(limit)).all()

    def has_permission(self, role: str, resource: str, action: str) -> bool:
        """Check if a role has a specific permission."""
        permission = self.db.scalars(
            select(Permission).where(
                Permission.resource == resource,
                Permission.action == action
            )
        ).first()
        
        if not permission:
            return False
            
        role_perm = self.db.scalars(
            select(RolePermission).where(
                RolePermission.role == role,
                RolePermission.permission_id == permission.id
            )
        ).first()
        
        return role_perm is not None

    def create_permission(self, name: str, resource: str, action: str, description: Optional[str] = None) -> Permission:
        """Create a new permission."""
        permission = Permission(
            name=name,
            resource=resource,
            action=action,
            description=description,
        )
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def assign_permission_to_role(self, role: str, permission_id: int) -> RolePermission:
        """Assign a permission to a role."""
        role_perm = RolePermission(role=role, permission_id=permission_id)
        self.db.add(role_perm)
        self.db.commit()
        return role_perm

    def get_config(self, key: str) -> Optional[str]:
        """Get system configuration value."""
        config = self.db.scalars(
            select(SystemConfig).where(SystemConfig.key == key)
        ).first()
        return config.value if config else None

    def set_config(self, key: str, value: str, description: Optional[str] = None) -> SystemConfig:
        """Set system configuration value."""
        config = self.db.scalars(
            select(SystemConfig).where(SystemConfig.key == key)
        ).first()
        
        if config:
            config.value = value
            config.description = description
            config.updated_at = datetime.utcnow()
        else:
            config = SystemConfig(key=key, value=value, description=description)
            self.db.add(config)
            
        self.db.commit()
        self.db.refresh(config)
        return config

    def get_all_configs(self) -> list[SystemConfig]:
        """Get all system configurations."""
        return self.db.scalars(select(SystemConfig)).all()