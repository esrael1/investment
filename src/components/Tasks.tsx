import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, UserPackage, Task, UserTask } from "../lib/supabase";
import { CheckSquare } from "lucide-react";
import { format, isToday } from "date-fns";

export default function Tasks() {
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const { user, refreshUser } = useAuth();
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [availableTasks, setAvailableTasks] = useState<{ [key: string]: Task[] }>({});
  const [acceptedTasks, setAcceptedTasks] = useState<{ [key: string]: string[] }>({});
  const [completedTasks, setCompletedTasks] = useState<UserTask[]>([]);
  const [uploadFiles, setUploadFiles] = useState<{ [key: string]: File | null }>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 💥 this is the magic sauce

  useEffect(() => {
    if (user) fetchTasksData();
  }, [user]);

  const fetchTasksData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: packages } = await supabase
        .from("user_packages")
        .select(`*, packages (*)`)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("expiry_date", new Date().toISOString());

      const tasksData: { [key: string]: Task[] } = {};

      if (packages) {
        for (const pkg of packages) {
          const lastTaskDate = pkg.last_task_date ? new Date(pkg.last_task_date) : null;
          const isNewDay = !lastTaskDate || lastTaskDate.toDateString() !== new Date().toDateString();

          if (isNewDay) {
            await supabase
              .from("user_packages")
              .update({
                tasks_completed_today: 0,
                last_task_date: new Date().toISOString().split("T")[0],
              })
              .eq("id", pkg.id);
            pkg.tasks_completed_today = 0;
            pkg.last_task_date = new Date().toISOString().split("T")[0];
          }

          const { data: tasks } = await supabase
            .from("tasks")
            .select("*")
            .eq("package_id", pkg.package_id)
            .eq("is_active", true);

          if (tasks) tasksData[pkg.id] = tasks;
        }
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: completed } = await supabase
        .from("user_packages")
        .select(`*, tasks (*)`)
        .eq("user_id", user.id)
        .gte("completed_at", `${today}T00:00:00Z`)
        .lte("completed_at", `${today}T23:59:59Z`);

      setUserPackages(packages || []);
      setAvailableTasks(tasksData);
      setCompletedTasks(completed || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCompleteTask = (pkg: UserPackage) => {
    const lastTaskDate = pkg.last_task_date ? new Date(pkg.last_task_date) : null;
    const isNewDay = !lastTaskDate || !isToday(lastTaskDate);
    return isNewDay || pkg.tasks_completed_today < (pkg.packages?.daily_tasks || 0);
  };

  const handleAcceptTask = (taskId: string, pkgId: string) => {
    setAcceptedTasks((prev) => ({
      ...prev,
      [pkgId]: [...(prev[pkgId] || []), taskId],
    }));
  };

  const handleFileUpload = (taskId: string, file: File) => {
    setUploadFiles((prev) => ({ ...prev, [taskId]: file }));
  };

  const handleCompleteTask = async (task: Task, pkg: UserPackage) => {
    if (!user) return;
    if (!uploadFiles[task.id]) return alert("Please upload a screenshot first!");
    if (isSubmitting) return alert("Hang tight, one task at a time 🚀");

    setIsSubmitting(true);
    setCompleting(task.id);

    try {
      const file = uploadFiles[task.id];
      const filePath = `${user.id}/${Date.now()}_${file?.name}`;
      const { error: uploadError } = await supabase.storage
        .from("task_screenshots")
        .upload(filePath, file as File);
      if (uploadError) throw uploadError;

      const screenshotUrl = supabase.storage.from("task_screenshots").getPublicUrl(filePath).data.publicUrl;

      const { error: taskError } = await supabase.from("user_tasks").insert({
        user_id: user.id,
        task_id: task.id,
        user_package_id: pkg.id,
        reward_earned: task.reward_amount,
        screenshot_url: screenshotUrl,
      });
      if (taskError) throw taskError;

      const { error: balanceError } = await supabase.rpc("increment_balance", {
        user_id: user.id,
        amount: task.reward_amount,
      });
      if (balanceError) throw balanceError;

      const newTasksCompleted = pkg.tasks_completed_today + 1;
      const { error: packageError } = await supabase
        .from("user_packages")
        .update({
          tasks_completed_today: newTasksCompleted,
          last_task_date: new Date().toISOString().split("T")[0],
          total_earned: pkg.total_earned + task.reward_amount,
        })
        .eq("id", pkg.id);
      if (packageError) throw packageError;

      await refreshUser();
      await fetchTasksData();
      alert(`✅ Task completed! You earned ${task.reward_amount.toFixed(2)} ETB`);
    } catch (err) {
      console.error("Error completing task:", err);
      alert("❌ Something went wrong, try again.");
    } finally {
      setCompleting(null);
      setIsSubmitting(false);
    }
  };

  const isTaskCompletedToday = (taskId: string, pkgId: string) =>
    completedTasks.some((ct) => ct.task_id === taskId && ct.user_package_id === pkgId);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="text-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8 rounded-2xl">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Daily Tasks
        </h1>
        <p className="mt-3 text-gray-300 text-lg">Complete tasks and stack rewards 💸</p>
      </div>

      {userPackages.length > 0 ? (
        userPackages.map((pkg) => {
          const tasks = availableTasks[pkg.id] || [];
          const accepted = acceptedTasks[pkg.id] || [];
          const doneToday = completedTasks.filter((ct) => ct.user_package_id === pkg.id).length;
          const canDo = canCompleteTask(pkg);
          const maxTasks = pkg.packages?.daily_tasks || 0;

          return (
            <div key={pkg.id} className="bg-gray-100 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-purple-700">{pkg.packages?.name}</h3>
                  <p className="text-gray-500 text-sm">
                    Daily Return:{" "}
                    <span className="font-semibold text-green-600">
                      {pkg.packages?.daily_return} Birr
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">
                      Expires: {format(new Date(pkg.expiry_date), "MMM dd, yyyy")}
                    </span>
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  {doneToday}/{maxTasks} done today
                </div>
              </div>

              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center">No tasks yet 😅</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tasks.map((task, i) => {
                    const acceptedTask = accepted.includes(task.id);
                    const completed = isTaskCompletedToday(task.id, pkg.id);
                    const canPerform = canDo && !completed && doneToday < maxTasks;

                    return (
                      <div key={task.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
                        <h4 className="font-semibold mb-2 text-gray-900">
                          {i + 1}. {task.title}
                        </h4>
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                        {completed ? (
                          <p className="text-green-600 font-medium flex items-center">
                            <CheckSquare className="w-5 h-5 mr-1" /> Completed
                          </p>
                        ) : !acceptedTask ? (
                          <button
                            onClick={() => handleAcceptTask(task.id, pkg.id)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Accept Task
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleFileUpload(task.id, file);
                                setSelectedImageName(file ? file.name : "");
                              }}
                              className="border border-gray-400 p-2 w-full"
                            />

                            <button
                              onClick={() => handleCompleteTask(task, pkg)}
                              disabled={!canPerform || completing === task.id || isSubmitting}
                              className={`w-full py-2 rounded-lg text-white font-medium transition ${
                                completing === task.id || isSubmitting
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : canPerform
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                            >
                              {completing === task.id
                                ? "Completing..."
                                : isSubmitting
                                ? "Please wait..."
                                : "Submit & Complete"}
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
