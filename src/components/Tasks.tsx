import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserPackage, Task, UserTask } from '../lib/supabase';
import { CheckSquare, Clock, Gift } from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function Tasks() {
  const { user, refreshUser } = useAuth();
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [availableTasks, setAvailableTasks] = useState<{ [key: string]: Task[] }>({});
  const [completedTasks, setCompletedTasks] = useState<UserTask[]>([]);
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
      // Fetch active user packages
      const { data: packages } = await supabase
        .from('user_packages')
        .select(`
          *,
          packages (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString());

      // Fetch available tasks for each package
      const tasksData: { [key: string]: Task[] } = {};
      if (packages) {
        for (const pkg of packages) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('package_id', pkg.package_id)
            .eq('is_active', true);
          
          if (tasks) {
            tasksData[pkg.id] = tasks;
          }
        }
      }

      // Fetch completed tasks for today
      const today = new Date().toISOString().split('T')[0];
      const { data: completed } = await supabase
        .from('user_tasks')
        .select(`
          *,
          tasks (*)
        `)
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

  const getTasksCompletedToday = (userPackageId: string) => {
    return completedTasks.filter(ct => ct.user_package_id === userPackageId).length;
  };

  const isTaskCompletedToday = (taskId: string, userPackageId: string) => {
    return completedTasks.some(ct => ct.task_id === taskId && ct.user_package_id === userPackageId);
  };

  const handleCompleteTask = async (task: Task, userPackage: UserPackage) => {
    if (!user) return;

    setCompleting(task.id);

    try {
      // Add completed task record
      const { error: taskError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task_id: task.id,
          user_package_id: userPackage.id,
          reward_earned: task.reward_amount,
        });

      if (taskError) throw taskError;

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: task.reward_amount
      });

      if (balanceError) throw balanceError;

      // Update user package stats
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

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'task_reward',
          amount: task.reward_amount,
          description: `Completed task: ${task.title}`,
          reference_id: task.id,
        });

      if (transactionError) throw transactionError;

      // Refresh data
      await refreshUser();
      await fetchTasksData();
      
      alert(`Task completed! You earned $${task.reward_amount.toFixed(2)}`);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
        <p className="text-gray-600">Complete tasks to earn daily rewards from your packages</p>
      </div>

      {userPackages.length > 0 ? (
        <div className="space-y-8">
          {userPackages.map((userPackage) => {
            const tasks = availableTasks[userPackage.id] || [];
            const tasksCompletedToday = getTasksCompletedToday(userPackage.id);
            const maxDailyTasks = userPackage.packages?.daily_tasks || 0;
            const canComplete = canCompleteTask(userPackage);

            return (
              <div key={userPackage.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {userPackage.packages?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Daily Return: ${userPackage.packages?.daily_return} | 
                        Expires: {format(new Date(userPackage.expiry_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        <span className="font-medium">
                          {tasksCompletedToday}/{maxDailyTasks} tasks completed today
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Total earned: ${userPackage.total_earned.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {tasks.map((task) => {
                        const isCompleted = isTaskCompletedToday(task.id, userPackage.id);
                        const canCompleteThis = canComplete && !isCompleted && tasksCompletedToday < maxDailyTasks;

                        return (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                              </div>
                              {isCompleted && (
                                <CheckSquare className="h-5 w-5 text-green-600 ml-2" />
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-green-600">
                                <Gift className="h-4 w-4 mr-1" />
                                <span className="font-medium">${task.reward_amount.toFixed(2)}</span>
                              </div>

                              <button
                                onClick={() => handleCompleteTask(task, userPackage)}
                                disabled={!canCompleteThis || completing === task.id}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : canCompleteThis
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {completing === task.id
                                  ? 'Completing...'
                                  : isCompleted
                                  ? 'Completed'
                                  : tasksCompletedToday >= maxDailyTasks
                                  ? 'Daily limit reached'
                                  : 'Complete Task'
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No tasks available for this package</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No active packages. Purchase a package to start earning!</p>
        </div>
      )}
    </div>
  );
}