// 考试系统路由
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase } = require('../config/database');

// ========== 教师端 API ==========

// 创建考试
router.post('/', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      title,
      description,
      class_id,
      course_id,
      total_points,
      pass_score,
      duration_minutes,
      start_time,
      end_time,
      shuffle_questions,
      shuffle_options,
      show_answers_after,
      max_attempts,
      require_webcam,
      prevent_tab_switch
    } = req.body;

    // 验证班级权限
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', class_id)
      .single();

    if (!classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权为该班级创建考试'
      });
    }

    // 创建考试
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title,
        description,
        class_id,
        course_id,
        teacher_id: teacherId,
        total_points: total_points || 100,
        pass_score: pass_score || 60,
        duration_minutes,
        start_time,
        end_time,
        shuffle_questions: shuffle_questions || false,
        shuffle_options: shuffle_options || false,
        show_answers_after: show_answers_after || false,
        max_attempts: max_attempts || 1,
        require_webcam: require_webcam || false,
        prevent_tab_switch: prevent_tab_switch || false,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '考试创建成功',
      data: exam
    });
  } catch (error) {
    console.error('创建考试失败:', error);
    res.status(500).json({
      success: false,
      message: '创建考试失败',
      error: error.message
    });
  }
});

// 添加试题到考试
router.post('/:examId/questions', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId } = req.params;
    const { questions } = req.body; // 数组

    // 验证考试权限
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id, status')
      .eq('id', examId)
      .single();

    if (!exam || exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权修改此考试'
      });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只能修改草稿状态的考试'
      });
    }

    // 批量添加试题
    const questionsToInsert = questions.map((q, index) => ({
      exam_id: examId,
      question_order: q.question_order || index + 1,
      question_type: q.question_type,
      question_text: q.question_text,
      question_image: q.question_image,
      options: q.options || [],
      correct_answer: q.correct_answer,
      answer_explanation: q.answer_explanation,
      points: q.points,
      difficulty: q.difficulty,
      tags: q.tags || []
    }));

    const { data: addedQuestions, error } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `成功添加${addedQuestions.length}道题目`,
      data: addedQuestions
    });
  } catch (error) {
    console.error('添加试题失败:', error);
    res.status(500).json({
      success: false,
      message: '添加试题失败',
      error: error.message
    });
  }
});

// 发布考试
router.post('/:examId/publish', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId } = req.params;

    // 验证权限
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id, class_id')
      .eq('id', examId)
      .single();

    if (!exam || exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此考试'
      });
    }

    // 检查是否有试题
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('exam_id', examId);

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请先添加试题后再发布'
      });
    }

    // 发布考试
    const { data: updated, error } = await supabase
      .from('exams')
      .update({ status: 'published' })
      .eq('id', examId)
      .select()
      .single();

    if (error) throw error;

    // 通知班级学生
    const { data: students } = await supabase
      .from('class_members')
      .select('user_id')
      .eq('class_id', exam.class_id)
      .eq('role', 'student')
      .eq('status', 'active');

    if (students && students.length > 0) {
      const notifications = students.map(s => ({
        user_id: s.user_id,
        type: 'exam_upcoming',
        title: `新考试：${updated.title}`,
        content: `考试时间：${new Date(updated.start_time).toLocaleString()}`,
        related_id: examId
      }));

      await supabase.from('notifications').insert(notifications);
    }

    res.json({
      success: true,
      message: '考试已发布',
      data: updated
    });
  } catch (error) {
    console.error('发布考试失败:', error);
    res.status(500).json({
      success: false,
      message: '发布考试失败',
      error: error.message
    });
  }
});

// 获取考试列表（教师）
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('exams')
      .select(`
        *,
        questions_count:exam_questions(count),
        attempts_count:exam_attempts(count)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: exams, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: exams || []
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
});

// 获取考试详情（教师）
router.get('/:examId', auth, async (req, res) => {
  try {
    const { examId } = req.params;

    const { data: exam, error } = await supabase
      .from('exams')
      .select(`
        *,
        class:classes(id, name),
        course:courses(id, title),
        teacher:users!exams_teacher_id_fkey(id, username)
      `)
      .eq('id', examId)
      .single();

    if (error) throw error;

    // 获取试题
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order', { ascending: true });

    exam.questions = questions || [];

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试详情失败',
      error: error.message
    });
  }
});

// 获取考试的所有答卷（教师查看）
router.get('/:examId/attempts', auth, async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('exam_attempts')
      .select(`
        *,
        student:users!exam_attempts_student_id_fkey(id, username, avatar)
      `)
      .eq('exam_id', examId)
      .order('submit_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: attempts, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: attempts || []
    });
  } catch (error) {
    console.error('获取答卷列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取答卷列表失败',
      error: error.message
    });
  }
});

// 批改主观题
router.post('/attempts/:attemptId/grade', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attemptId } = req.params;
    const { question_scores } = req.body; // {question_id: score}

    // 获取答卷信息
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(id, teacher_id)
      `)
      .eq('id', attemptId)
      .single();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 验证权限
    if (attempt.exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权批改此答卷'
      });
    }

    // 计算总分
    const totalScore = Object.values(question_scores).reduce((sum, score) => sum + parseFloat(score), 0);

    // 更新答卷
    const { data: updated, error } = await supabase
      .from('exam_attempts')
      .update({
        total_score: totalScore,
        graded_by: teacherId,
        graded_at: new Date().toISOString(),
        status: 'graded'
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;

    // 通知学生
    await supabase.from('notifications').insert({
      user_id: attempt.student_id,
      type: 'grade_released',
      title: '考试成绩已公布',
      content: `您的考试"${attempt.exam.title}"已批改，得分：${totalScore}`,
      related_id: attempt.exam_id
    });

    res.json({
      success: true,
      message: '批改完成',
      data: updated
    });
  } catch (error) {
    console.error('批改答卷失败:', error);
    res.status(500).json({
      success: false,
      message: '批改答卷失败',
      error: error.message
    });
  }
});

// ========== 学生端 API ==========

// 获取我的考试列表
router.get('/my/list', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { class_id } = req.query;

    // 获取学生的班级
    const { data: myClasses } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('user_id', studentId)
      .eq('role', 'student')
      .eq('status', 'active');

    if (!myClasses || myClasses.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const classIds = class_id ? [class_id] : myClasses.map(c => c.class_id);

    // 获取考试列表
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        class:classes(id, name),
        my_attempts:exam_attempts!left(id, status, total_score, submit_time)
      `)
      .in('class_id', classIds)
      .eq('status', 'published')
      .eq('exam_attempts.student_id', studentId)
      .order('start_time', { ascending: true });

    if (error) throw error;

    // 分类考试
    const now = new Date();
    const categorized = {
      upcoming: [],
      ongoing: [],
      completed: []
    };

    exams?.forEach(exam => {
      const startTime = new Date(exam.start_time);
      const endTime = new Date(exam.end_time);
      const myAttempt = exam.my_attempts?.[0];

      if (myAttempt && myAttempt.status === 'graded') {
        categorized.completed.push(exam);
      } else if (now < startTime) {
        categorized.upcoming.push(exam);
      } else if (now >= startTime && now <= endTime) {
        categorized.ongoing.push(exam);
      } else {
        // 已过期但未完成
        categorized.completed.push(exam);
      }
    });

    res.json({
      success: true,
      data: {
        all: exams || [],
        categorized
      }
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
});

// 开始考试
router.post('/:examId/start', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { examId } = req.params;

    // 获取考试信息
    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    // 检查考试时间
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: '考试尚未开始'
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: '考试已结束'
      });
    }

    // 检查考试次数
    const { data: existingAttempts } = await supabase
      .from('exam_attempts')
      .select('id, attempt_number')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });

    const attemptNumber = existingAttempts && existingAttempts.length > 0
      ? existingAttempts[0].attempt_number + 1
      : 1;

    if (attemptNumber > exam.max_attempts) {
      return res.status(400).json({
        success: false,
        message: `已达到最大考试次数（${exam.max_attempts}次）`
      });
    }

    // 获取试题（可能需要打乱顺序）
    let { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order', { ascending: true });

    if (exam.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    if (exam.shuffle_options) {
      questions = questions.map(q => {
        if (q.options && q.options.length > 0) {
          q.options = q.options.sort(() => Math.random() - 0.5);
        }
        return q;
      });
    }

    // 创建答卷
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        student_id: studentId,
        attempt_number: attemptNumber,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        answers: {}
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '考试已开始',
      data: {
        attempt,
        questions: questions.map(q => ({
          ...q,
          correct_answer: undefined, // 不返回答案
          answer_explanation: undefined
        }))
      }
    });
  } catch (error) {
    console.error('开始考试失败:', error);
    res.status(500).json({
      success: false,
      message: '开始考试失败',
      error: error.message
    });
  }
});

// 提交答案（自动保存）
router.post('/attempts/:attemptId/answer', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;
    const { question_id, answer } = req.body;

    // 获取答卷
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('student_id, answers')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此答卷'
      });
    }

    // 更新答案
    const answers = attempt.answers || {};
    answers[question_id] = answer;

    const { error } = await supabase
      .from('exam_attempts')
      .update({ answers })
      .eq('id', attemptId);

    if (error) throw error;

    res.json({
      success: true,
      message: '答案已保存'
    });
  } catch (error) {
    console.error('保存答案失败:', error);
    res.status(500).json({
      success: false,
      message: '保存答案失败',
      error: error.message
    });
  }
});

// 提交考试
router.post('/attempts/:attemptId/submit', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;

    // 获取答卷和考试信息
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(*)
      `)
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 获取试题和答案
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', attempt.exam_id);

    // 自动判分（选择题、判断题）
    let autoGradedScore = 0;
    let needManualGrade = false;

    questions.forEach(q => {
      const studentAnswer = attempt.answers[q.id];
      
      if (['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type)) {
        // 自动判分
        const isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(q.correct_answer);
        if (isCorrect) {
          autoGradedScore += parseFloat(q.points);
        }
      } else {
        // 需要人工批改
        needManualGrade = true;
      }
    });

    // 更新答卷状态
    const updateData = {
      submit_time: new Date().toISOString(),
      status: needManualGrade ? 'submitted' : 'graded',
      auto_graded: !needManualGrade
    };

    if (!needManualGrade) {
      updateData.total_score = autoGradedScore;
      updateData.is_passed = autoGradedScore >= attempt.exam.pass_score;
      updateData.graded_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('exam_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: needManualGrade ? '考试已提交，等待批改' : '考试已提交并自动判分',
      data: updated
    });
  } catch (error) {
    console.error('提交考试失败:', error);
    res.status(500).json({
      success: false,
      message: '提交考试失败',
      error: error.message
    });
  }
});

// 获取我的答卷详情
router.get('/attempts/:attemptId/result', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;

    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(*, questions:exam_questions(*))
      `)
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 如果考试设置不显示答案，则隐藏正确答案
    if (!attempt.exam.show_answers_after && attempt.status !== 'graded') {
      attempt.exam.questions = attempt.exam.questions.map(q => ({
        ...q,
        correct_answer: undefined,
        answer_explanation: undefined
      }));
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (error) {
    console.error('获取答卷详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取答卷详情失败',
      error: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase } = require('../config/database');

// ========== 教师端 API ==========

// 创建考试
router.post('/', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      title,
      description,
      class_id,
      course_id,
      total_points,
      pass_score,
      duration_minutes,
      start_time,
      end_time,
      shuffle_questions,
      shuffle_options,
      show_answers_after,
      max_attempts,
      require_webcam,
      prevent_tab_switch
    } = req.body;

    // 验证班级权限
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', class_id)
      .single();

    if (!classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权为该班级创建考试'
      });
    }

    // 创建考试
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title,
        description,
        class_id,
        course_id,
        teacher_id: teacherId,
        total_points: total_points || 100,
        pass_score: pass_score || 60,
        duration_minutes,
        start_time,
        end_time,
        shuffle_questions: shuffle_questions || false,
        shuffle_options: shuffle_options || false,
        show_answers_after: show_answers_after || false,
        max_attempts: max_attempts || 1,
        require_webcam: require_webcam || false,
        prevent_tab_switch: prevent_tab_switch || false,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '考试创建成功',
      data: exam
    });
  } catch (error) {
    console.error('创建考试失败:', error);
    res.status(500).json({
      success: false,
      message: '创建考试失败',
      error: error.message
    });
  }
});

// 添加试题到考试
router.post('/:examId/questions', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId } = req.params;
    const { questions } = req.body; // 数组

    // 验证考试权限
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id, status')
      .eq('id', examId)
      .single();

    if (!exam || exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权修改此考试'
      });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只能修改草稿状态的考试'
      });
    }

    // 批量添加试题
    const questionsToInsert = questions.map((q, index) => ({
      exam_id: examId,
      question_order: q.question_order || index + 1,
      question_type: q.question_type,
      question_text: q.question_text,
      question_image: q.question_image,
      options: q.options || [],
      correct_answer: q.correct_answer,
      answer_explanation: q.answer_explanation,
      points: q.points,
      difficulty: q.difficulty,
      tags: q.tags || []
    }));

    const { data: addedQuestions, error } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `成功添加${addedQuestions.length}道题目`,
      data: addedQuestions
    });
  } catch (error) {
    console.error('添加试题失败:', error);
    res.status(500).json({
      success: false,
      message: '添加试题失败',
      error: error.message
    });
  }
});

// 发布考试
router.post('/:examId/publish', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId } = req.params;

    // 验证权限
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id, class_id')
      .eq('id', examId)
      .single();

    if (!exam || exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此考试'
      });
    }

    // 检查是否有试题
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('exam_id', examId);

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请先添加试题后再发布'
      });
    }

    // 发布考试
    const { data: updated, error } = await supabase
      .from('exams')
      .update({ status: 'published' })
      .eq('id', examId)
      .select()
      .single();

    if (error) throw error;

    // 通知班级学生
    const { data: students } = await supabase
      .from('class_members')
      .select('user_id')
      .eq('class_id', exam.class_id)
      .eq('role', 'student')
      .eq('status', 'active');

    if (students && students.length > 0) {
      const notifications = students.map(s => ({
        user_id: s.user_id,
        type: 'exam_upcoming',
        title: `新考试：${updated.title}`,
        content: `考试时间：${new Date(updated.start_time).toLocaleString()}`,
        related_id: examId
      }));

      await supabase.from('notifications').insert(notifications);
    }

    res.json({
      success: true,
      message: '考试已发布',
      data: updated
    });
  } catch (error) {
    console.error('发布考试失败:', error);
    res.status(500).json({
      success: false,
      message: '发布考试失败',
      error: error.message
    });
  }
});

// 获取考试列表（教师）
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('exams')
      .select(`
        *,
        questions_count:exam_questions(count),
        attempts_count:exam_attempts(count)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: exams, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: exams || []
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
});

// 获取考试详情（教师）
router.get('/:examId', auth, async (req, res) => {
  try {
    const { examId } = req.params;

    const { data: exam, error } = await supabase
      .from('exams')
      .select(`
        *,
        class:classes(id, name),
        course:courses(id, title),
        teacher:users!exams_teacher_id_fkey(id, username)
      `)
      .eq('id', examId)
      .single();

    if (error) throw error;

    // 获取试题
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order', { ascending: true });

    exam.questions = questions || [];

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('获取考试详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试详情失败',
      error: error.message
    });
  }
});

// 获取考试的所有答卷（教师查看）
router.get('/:examId/attempts', auth, async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('exam_attempts')
      .select(`
        *,
        student:users!exam_attempts_student_id_fkey(id, username, avatar)
      `)
      .eq('exam_id', examId)
      .order('submit_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: attempts, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: attempts || []
    });
  } catch (error) {
    console.error('获取答卷列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取答卷列表失败',
      error: error.message
    });
  }
});

// 批改主观题
router.post('/attempts/:attemptId/grade', auth, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attemptId } = req.params;
    const { question_scores } = req.body; // {question_id: score}

    // 获取答卷信息
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(id, teacher_id)
      `)
      .eq('id', attemptId)
      .single();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 验证权限
    if (attempt.exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: '无权批改此答卷'
      });
    }

    // 计算总分
    const totalScore = Object.values(question_scores).reduce((sum, score) => sum + parseFloat(score), 0);

    // 更新答卷
    const { data: updated, error } = await supabase
      .from('exam_attempts')
      .update({
        total_score: totalScore,
        graded_by: teacherId,
        graded_at: new Date().toISOString(),
        status: 'graded'
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;

    // 通知学生
    await supabase.from('notifications').insert({
      user_id: attempt.student_id,
      type: 'grade_released',
      title: '考试成绩已公布',
      content: `您的考试"${attempt.exam.title}"已批改，得分：${totalScore}`,
      related_id: attempt.exam_id
    });

    res.json({
      success: true,
      message: '批改完成',
      data: updated
    });
  } catch (error) {
    console.error('批改答卷失败:', error);
    res.status(500).json({
      success: false,
      message: '批改答卷失败',
      error: error.message
    });
  }
});

// ========== 学生端 API ==========

// 获取我的考试列表
router.get('/my/list', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { class_id } = req.query;

    // 获取学生的班级
    const { data: myClasses } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('user_id', studentId)
      .eq('role', 'student')
      .eq('status', 'active');

    if (!myClasses || myClasses.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const classIds = class_id ? [class_id] : myClasses.map(c => c.class_id);

    // 获取考试列表
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        class:classes(id, name),
        my_attempts:exam_attempts!left(id, status, total_score, submit_time)
      `)
      .in('class_id', classIds)
      .eq('status', 'published')
      .eq('exam_attempts.student_id', studentId)
      .order('start_time', { ascending: true });

    if (error) throw error;

    // 分类考试
    const now = new Date();
    const categorized = {
      upcoming: [],
      ongoing: [],
      completed: []
    };

    exams?.forEach(exam => {
      const startTime = new Date(exam.start_time);
      const endTime = new Date(exam.end_time);
      const myAttempt = exam.my_attempts?.[0];

      if (myAttempt && myAttempt.status === 'graded') {
        categorized.completed.push(exam);
      } else if (now < startTime) {
        categorized.upcoming.push(exam);
      } else if (now >= startTime && now <= endTime) {
        categorized.ongoing.push(exam);
      } else {
        // 已过期但未完成
        categorized.completed.push(exam);
      }
    });

    res.json({
      success: true,
      data: {
        all: exams || [],
        categorized
      }
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
});

// 开始考试
router.post('/:examId/start', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { examId } = req.params;

    // 获取考试信息
    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    // 检查考试时间
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: '考试尚未开始'
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: '考试已结束'
      });
    }

    // 检查考试次数
    const { data: existingAttempts } = await supabase
      .from('exam_attempts')
      .select('id, attempt_number')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });

    const attemptNumber = existingAttempts && existingAttempts.length > 0
      ? existingAttempts[0].attempt_number + 1
      : 1;

    if (attemptNumber > exam.max_attempts) {
      return res.status(400).json({
        success: false,
        message: `已达到最大考试次数（${exam.max_attempts}次）`
      });
    }

    // 获取试题（可能需要打乱顺序）
    let { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order', { ascending: true });

    if (exam.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    if (exam.shuffle_options) {
      questions = questions.map(q => {
        if (q.options && q.options.length > 0) {
          q.options = q.options.sort(() => Math.random() - 0.5);
        }
        return q;
      });
    }

    // 创建答卷
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        student_id: studentId,
        attempt_number: attemptNumber,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        answers: {}
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '考试已开始',
      data: {
        attempt,
        questions: questions.map(q => ({
          ...q,
          correct_answer: undefined, // 不返回答案
          answer_explanation: undefined
        }))
      }
    });
  } catch (error) {
    console.error('开始考试失败:', error);
    res.status(500).json({
      success: false,
      message: '开始考试失败',
      error: error.message
    });
  }
});

// 提交答案（自动保存）
router.post('/attempts/:attemptId/answer', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;
    const { question_id, answer } = req.body;

    // 获取答卷
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('student_id, answers')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此答卷'
      });
    }

    // 更新答案
    const answers = attempt.answers || {};
    answers[question_id] = answer;

    const { error } = await supabase
      .from('exam_attempts')
      .update({ answers })
      .eq('id', attemptId);

    if (error) throw error;

    res.json({
      success: true,
      message: '答案已保存'
    });
  } catch (error) {
    console.error('保存答案失败:', error);
    res.status(500).json({
      success: false,
      message: '保存答案失败',
      error: error.message
    });
  }
});

// 提交考试
router.post('/attempts/:attemptId/submit', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;

    // 获取答卷和考试信息
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(*)
      `)
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 获取试题和答案
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', attempt.exam_id);

    // 自动判分（选择题、判断题）
    let autoGradedScore = 0;
    let needManualGrade = false;

    questions.forEach(q => {
      const studentAnswer = attempt.answers[q.id];
      
      if (['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type)) {
        // 自动判分
        const isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(q.correct_answer);
        if (isCorrect) {
          autoGradedScore += parseFloat(q.points);
        }
      } else {
        // 需要人工批改
        needManualGrade = true;
      }
    });

    // 更新答卷状态
    const updateData = {
      submit_time: new Date().toISOString(),
      status: needManualGrade ? 'submitted' : 'graded',
      auto_graded: !needManualGrade
    };

    if (!needManualGrade) {
      updateData.total_score = autoGradedScore;
      updateData.is_passed = autoGradedScore >= attempt.exam.pass_score;
      updateData.graded_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('exam_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: needManualGrade ? '考试已提交，等待批改' : '考试已提交并自动判分',
      data: updated
    });
  } catch (error) {
    console.error('提交考试失败:', error);
    res.status(500).json({
      success: false,
      message: '提交考试失败',
      error: error.message
    });
  }
});

// 获取我的答卷详情
router.get('/attempts/:attemptId/result', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { attemptId } = req.params;

    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(*, questions:exam_questions(*))
      `)
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: '答卷不存在'
      });
    }

    // 如果考试设置不显示答案，则隐藏正确答案
    if (!attempt.exam.show_answers_after && attempt.status !== 'graded') {
      attempt.exam.questions = attempt.exam.questions.map(q => ({
        ...q,
        correct_answer: undefined,
        answer_explanation: undefined
      }));
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (error) {
    console.error('获取答卷详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取答卷详情失败',
      error: error.message
    });
  }
});

module.exports = router;




















































