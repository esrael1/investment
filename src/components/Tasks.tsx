import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserPackage, Task, UserTask } from '../lib/supabase';
import { CheckSquare, Gift, Upload } from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function Tasks() {
  const { user, refreshUser } = useAuth();
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [availableTasks, setAvailableTasks] = useState<{ [key: string]: Task[] }>({});
  const [acceptedTasks, setAcceptedTasks] = useState<{ [key: string]: string[] }>({});
  const [completedTasks, setCompletedTasks] = useState<UserTask[]>([]);
  const [uploadFiles, setUploadFiles] = useState<{ [key: string]: File | null }>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasksData();
    }
  }, [user]);

  const fetchTasksData = async () => {
    if (!user) return;
    try {
      const { data: packages } = await supabase
        .from('user_packages')
        .select(`*, packages (*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString());

      const tasksData: { [key: string]: Task[] } = {};
      if (packages) {
        for (const pkg of packages) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('package_id', pkg.package_id)
            .eq('is_active', true);
          if (tasks) tasksData[pkg.id] = tasks;
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: completed } = await supabase
        .from('user_tasks')
        .select(`*, tasks (*)`)
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00Z`)
        .lte('completed_at', `${today}T23:59:59Z`);

      setUserPackages(packages || []);
      setAvailableTasks(tasksData);
      setCompletedTasks(completed || []);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCompleteTask = (userPackage: UserPackage) => {
    const today = new Date();
    const lastTaskDate = userPackage.last_task_date ? new Date(userPackage.last_task_date) : null;
    const isNewDay = !lastTaskDate || !isToday(lastTaskDate);
    return isNewDay || userPackage.tasks_completed_today < (userPackage.packages?.daily_tasks || 0);
  };

  const handleAcceptTask = (taskId: string, userPackageId: string) => {
    setAcceptedTasks(prev => ({
      ...prev,
      [userPackageId]: [...(prev[userPackageId] || []), taskId],
    }));
  };

  const handleFileUpload = (taskId: string, file: File) => {
    setUploadFiles(prev => ({ ...prev, [taskId]: file }));
  };

  const handleCompleteTask = async (task: Task, userPackage: UserPackage) => {
    if (!user) return;
    if (!uploadFiles[task.id]) return alert('Please upload a screenshot first.');

    setCompleting(task.id);

    try {
      // Upload screenshot to Supabase storage
      const file = uploadFiles[task.id];
      const filePath = `${user.id}/${Date.now()}_${file?.name}`;
      const { error: uploadError } = await supabase.storage
        .from('task_screenshots')
        .upload(filePath, file as File);

      if (uploadError) throw uploadError;

      const screenshotUrl = supabase.storage
        .from('task_screenshots')
        .getPublicUrl(filePath).data.publicUrl;

      // Insert user task record
      const { error: taskError } = await supabase.from('user_tasks').insert({
        user_id: user.id,
        task_id: task.id,
        user_package_id: userPackage.id,
        reward_earned: task.reward_amount,
        screenshot_url: screenshotUrl,
      });

      if (taskError) throw taskError;

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: task.reward_amount,
      });

      if (balanceError) throw balanceError;

      // Update package stats
      const newTasksCompleted = userPackage.tasks_completed_today + 1;
      const { error: packageError } = await supabase
        .from('user_packages')
        .update({
          tasks_completed_today: newTasksCompleted,
          last_task_date: new Date().toISOString().split('T')[0],
          total_earned: userPackage.total_earned + task.reward_amount,
        })
        .eq('id', userPackage.id);

      if (packageError) throw packageError;

      await refreshUser();
      await fetchTasksData();
      alert(`✅ Task completed! You earned $${task.reward_amount.toFixed(2)}`);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('❌ Failed to complete task. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  const isTaskCompletedToday = (taskId: string, userPackageId: string) =>
    completedTasks.some(ct => ct.task_id === taskId && ct.user_package_id === userPackageId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="inset-0 pointer-events-none">
          <div className="text-center bg-gradient-to-br from-gray-0 via-gray-900 to-red-0 p-8 rounded-2xl">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Daily Tasks
            </h1>
            <p className="mt-3 text-gray-300 text-lg tracking-wide">
              <span className="font-semibold text-indigo-400">
                Accept and complete daily tasks to earn rewards.
              </span>
            </p>
            <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
          </div>
        </div>

      {userPackages.length > 0 ? (
        userPackages.map(pkg => {
          const tasks = availableTasks[pkg.id] || [];
          const accepted = acceptedTasks[pkg.id] || [];
          const tasksCompletedToday = completedTasks.filter(ct => ct.user_package_id === pkg.id).length;
          const canComplete = canCompleteTask(pkg);
          const maxDailyTasks = pkg.packages?.daily_tasks || 0;

          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex flex-col md:flex-row items-center justify-between p-4 mb-4 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
  {/* Package Info */}
  <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
    <div className="flex flex-col">
      <h3 className="text-xl font-bold text-purple-700">{pkg.packages?.name}</h3>
      <p className="text-gray-500 text-sm">
        Daily Return: <span className="font-semibold text-green-600">{pkg.packages?.daily_return} Birr</span><br />
        <span className="text-gray-400 text-xs">Expires: {format(new Date(pkg.expiry_date), 'MMM dd, yyyy')}</span>
      </p>
    </div>
  </div>

  {/* Task Progress */}
  <div className="flex flex-col items-end space-y-2 w-full md:w-auto mt-3 md:mt-0">
    <span className="text-gray-700 font-medium text-sm">{tasksCompletedToday}/{maxDailyTasks} tasks completed today</span>
    
    {/* Progress Bar */}
    <div className="w-full md:w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-3 bg-gradient-to-r from-purple-400 to-purple-600"
        style={{ width: `${(tasksCompletedToday / maxDailyTasks) * 100}%` }}
      ></div>
    </div>
  </div>
</div>
 

              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center">No tasks available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tasks.map(task => {
                    const acceptedTask = accepted.includes(task.id);
                    const completed = isTaskCompletedToday(task.id, pkg.id);
                    const canDo = canComplete && !completed && tasksCompletedToday < maxDailyTasks;

                    return (
                      <div key={task.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                        {completed ? (
                          <p className="text-green-600 font-medium flex items-center">
                            <CheckSquare className="w-4 h-4 mr-1" /> Completed
                          </p>
                        ) : !acceptedTask ? (
                          <button
                            onClick={() => handleAcceptTask(task.id, pkg.id)}
                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Accept Task
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              ✅ Follow, like, and comment on the post.  
                              Then upload a screenshot below:
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleFileUpload(task.id, e.target.files?.[0] || null)}
                              className="block w-full text-sm text-gray-700 border rounded p-2"
                            />
                            <button
                              onClick={() => handleCompleteTask(task, pkg)}
                              disabled={!canDo || completing === task.id}
                              className={`w-full py-2 rounded text-white font-medium ${
                                completing === task.id
                                  ? 'bg-gray-400'
                                  : canDo
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'bg-gray-300 cursor-not-allowed'
                              }`}
                            >
                              {completing === task.id ? 'Completing...' : 'Submit & Complete'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <CheckSquare className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No active packages found.</p>
        </div>
      )}
    </div>
  );
}
