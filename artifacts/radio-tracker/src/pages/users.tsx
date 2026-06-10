import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Users, Plus, Pencil, Trash2, ShieldCheck, Mic2, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface UserRecord {
  id: number;
  name: string;
  username: string;
  role: string;
  grade?: string | null;
  className?: string | null;
  status: string;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = { admin: "管理员", broadcaster: "播音员" };
const ROLE_ICON: Record<string, typeof ShieldCheck> = { admin: ShieldCheck, broadcaster: Mic2 };
const ROLE_COLOR: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  broadcaster: "bg-blue-100 text-blue-700 border-blue-200",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  disabled: "bg-gray-100 text-gray-500 border-gray-200",
};

type FormData = {
  name: string; username: string; password: string; confirmPassword: string;
  role: string; grade: string; className: string;
};
const EMPTY: FormData = { name: "", username: "", password: "", confirmPassword: "", role: "broadcaster", grade: "", className: "" };

export default function UsersPage() {
  const { authFetch, user: me } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [resetUser, setResetUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.username || !form.password) { toast({ title: "请填写所有必填字段", variant: "destructive" }); return; }
    if (form.password !== form.confirmPassword) { toast({ title: "两次密码不一致", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name: form.name, username: form.username, password: form.password, role: form.role, grade: form.grade, className: form.className }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "创建失败", variant: "destructive" }); return; }
      setCreateOpen(false);
      setForm(EMPTY);
      fetchUsers();
      toast({ title: `账号「${data.name}」已创建` });
    } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editUser || !form.name) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name, role: form.role, grade: form.grade, className: form.className }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "更新失败", variant: "destructive" }); return; }
      setEditUser(null);
      fetchUsers();
      toast({ title: "账号信息已更新" });
    } finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (u: UserRecord) => {
    const newStatus = u.status === "active" ? "disabled" : "active";
    const res = await authFetch(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    if (res.ok) { fetchUsers(); toast({ title: newStatus === "active" ? "账号已启用" : "账号已禁用" }); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast({ title: d.error, variant: "destructive" }); return; }
      setDeleteUser(null);
      fetchUsers();
      toast({ title: "账号已删除" });
    } finally { setSubmitting(false); }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/users/${resetUser.id}`, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      if (!res.ok) { const d = await res.json(); toast({ title: d.error, variant: "destructive" }); return; }
      setResetUser(null);
      setNewPassword("");
      toast({ title: "密码已重置" });
    } finally { setSubmitting(false); }
  };

  const openEdit = (u: UserRecord) => {
    setForm({ name: u.name, username: u.username, password: "", confirmPassword: "", role: u.role, grade: u.grade || "", className: u.className || "" });
    setEditUser(u);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />用户管理
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">管理广播站工作人员账号</p>
        </div>
        <Button className="gap-2 font-semibold" onClick={() => { setForm(EMPTY); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />创建账号
        </Button>
      </div>

      {/* User Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : !users.length ? (
            <div className="py-14 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>暂无工作人员账号</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => {
                const RoleIcon = ROLE_ICON[u.role] ?? ShieldCheck;
                const isMe = u.id === me?.id;
                return (
                  <div key={u.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${u.status === "disabled" ? "opacity-60" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <RoleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{u.name}</span>
                        {isMe && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">当前账号</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[u.role] ?? ""}`}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLOR[u.status]}`}>
                          {u.status === "active" ? "正常" : "已禁用"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">@{u.username}{u.grade && ` · ${u.grade}`}{u.className && `（${u.className}班）`}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="编辑" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="重置密码" onClick={() => { setResetUser(u); setNewPassword(""); }}><KeyRound className="h-3.5 w-3.5" /></Button>
                      {!isMe && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={u.status === "active" ? "禁用" : "启用"} onClick={() => handleToggleStatus(u)}>
                          {u.status === "active" ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />}
                        </Button>
                      )}
                      {!isMe && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="删除" onClick={() => setDeleteUser(u)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role legend */}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        {[
          { role: "admin", icon: ShieldCheck, label: "管理员", desc: "完整访问权限：用户管理、系统设置、所有功能" },
          { role: "broadcaster", icon: Mic2, label: "播音员", desc: "歌曲库管理、点歌审核、广播公告" },
        ].map(({ role, icon: Icon, label, desc }) => (
          <div key={role} className="flex gap-3 p-3 rounded-xl border bg-muted/30">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ROLE_COLOR[role]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div><p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建工作人员账号</DialogTitle><DialogDescription>为广播站成员创建登录账号</DialogDescription></DialogHeader>
          <UserForm form={form} setForm={setForm} showPassword />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? "创建中…" : "确认创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑账号 — {editUser?.name}</DialogTitle></DialogHeader>
          <UserForm form={form} setForm={setForm} showPassword={false} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>取消</Button>
            <Button onClick={handleEdit} disabled={submitting}>{submitting ? "保存中…" : "保存修改"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={!!resetUser} onOpenChange={o => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>重置密码 — {resetUser?.name}</DialogTitle><DialogDescription>为该账号设置新密码</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">新密码</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少6位" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>取消</Button>
            <Button onClick={handleResetPassword} disabled={submitting || newPassword.length < 6}>{submitting ? "重置中…" : "确认重置"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteUser} onOpenChange={o => !o && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>删除账号</DialogTitle><DialogDescription>确定要删除「{deleteUser?.name}」的账号吗？此操作不可撤销。</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? "删除中…" : "确认删除"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserForm({ form, setForm, showPassword }: { form: FormData; setForm: (f: FormData) => void; showPassword: boolean }) {
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label className="text-sm font-medium">姓名 *</label><Input value={form.name} onChange={set("name")} placeholder="例：李华" /></div>
        <div className="space-y-1.5"><label className="text-sm font-medium">用户名 *</label><Input value={form.username} onChange={set("username")} placeholder="登录用" disabled={!showPassword} /></div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">角色 *</label>
        <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="broadcaster">播音员（管理歌曲、审核点歌）</SelectItem>
            <SelectItem value="admin">管理员（完整权限）</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label className="text-sm font-medium">年级（选填）</label><Input value={form.grade} onChange={set("grade")} placeholder="例：高二" /></div>
        <div className="space-y-1.5"><label className="text-sm font-medium">班级（选填）</label><Input value={form.className} onChange={set("className")} placeholder="例：三班" /></div>
      </div>
      {showPassword && (
        <>
          <div className="space-y-1.5"><label className="text-sm font-medium">密码 *</label><Input type="password" value={form.password} onChange={set("password")} placeholder="至少6位" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium">确认密码 *</label><Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="再次输入密码" /></div>
        </>
      )}
    </div>
  );
}
