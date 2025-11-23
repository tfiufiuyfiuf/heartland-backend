// 角色权限控制中间件

export const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = req.user.role;
    
    // 检查用户角色是否在允许的角色列表中
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        detail: `需要 ${allowedRoles.join(' 或 ')} 角色，当前是 ${userRole}`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// 学生专用中间件
export const studentOnly = roleAuth('student');

// 教师专用中间件
export const teacherOnly = roleAuth('teacher');

// 家长专用中间件
export const parentOnly = roleAuth('parent');

// 管理员专用中间件
export const adminOnly = roleAuth('admin');

// 教师或管理员
export const teacherOrAdmin = roleAuth('teacher', 'admin');

// 家长或教师或管理员
export const parentOrTeacherOrAdmin = roleAuth('parent', 'teacher', 'admin');


