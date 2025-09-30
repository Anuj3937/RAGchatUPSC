
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, UserPlus, PlusCircle, Settings, Loader2 } from 'lucide-react';
import { ManageClassDialog } from '@/components/admin/ManageClassDialog';
import { collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Class as ClassType, UserRole } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import AppHeader from '@/components/AppHeader';

function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newClassName, setNewClassName] = useState('');
  const [newClassDivision, setNewClassDivision] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [managingClass, setManagingClass] = useState<ClassType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setUsers(usersData);
      setIsLoading(false);
    });

    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassType));
      setClasses(classesData);
    });

    return () => {
      unsubUsers();
      unsubClasses();
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    setIsCreatingUser(true);

    try {
      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newUserEmail, role: newUserRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast({
        title: 'User Created Successfully',
        description: data.message,
      });

      setNewUserEmail('');

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Creating User', description: error.message });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    // Note: Deleting users should also be handled via a secure backend API route for a complete solution.
    toast({
        title: 'Manual User Deletion Required',
        description: `For security, please delete the user with UID ${uid} directly in the Firebase Authentication console and Firestore.`,
        duration: 10000,
      });
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassDivision) return;
    try {
      await addDoc(collection(db, "classes"), {
        name: newClassName,
        division: newClassDivision,
        teacherId: null,
        studentIds: [],
      });
      toast({ title: 'Class Created', description: `${newClassName} has been created.` });
      setNewClassName('');
      setNewClassDivision('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create class.' });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, "classes", id));
      toast({ title: 'Class Deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete class.' });
    }
  };
  
  const handleUpdateClass = async (updatedClass: ClassType) => {
    try {
        const batch = writeBatch(db);

        // 1. Update the class document itself
        const classRef = doc(db, 'classes', updatedClass.id);
        batch.update(classRef, {
            teacherId: updatedClass.teacherId,
            studentIds: updatedClass.studentIds
        });

        // 2. Determine which students were added and which were removed
        const originalClass = classes.find(c => c.id === updatedClass.id);
        const originalStudentIds = new Set(originalClass?.studentIds || []);
        const newStudentIds = new Set(updatedClass.studentIds);

        // Find students that need their profiles updated
        const allAffectedStudentIds = new Set([...originalStudentIds, ...newStudentIds]);

        allAffectedStudentIds.forEach(studentId => {
            const userRef = doc(db, 'users', studentId);
            const userProfile = users.find(u => u.uid === studentId);
            
            // This should always be true, but it's good practice to check
            if (!userProfile) return;

            const userClassIds = new Set(userProfile.classIds || []);

            // If student is in the new set, ensure the classId is in their profile
            if (newStudentIds.has(studentId)) {
                userClassIds.add(updatedClass.id);
            } 
            // If student is NOT in the new set, ensure the classId is removed
            else {
                userClassIds.delete(updatedClass.id);
            }
            
            // Update the user's document in the batch
            batch.update(userRef, { classIds: Array.from(userClassIds) });
        });

        // 3. Commit all batched writes atomically
        await batch.commit();

        toast({ title: 'Class Updated', description: `${updatedClass.name} has been successfully updated.` });
        setManagingClass(null);
    } catch (error) {
        console.error("Failed to update class and student profiles:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update class. Check console for details.' });
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <>
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AppHeader title="Admin Dashboard" />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>Create new users and assign them a role.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="mb-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="user@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserRole} onValueChange={(value: UserRole) => setNewUserRole(value)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isCreatingUser}>
                  {isCreatingUser ? <Loader2 className="mr-2 animate-spin" /> : <UserPlus className="mr-2" />}
                  Create User
                </Button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.uid)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Manage Classes</CardTitle>
              <CardDescription>Create new classes for teachers and students.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClass} className="mb-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="className">Class Name</Label>
                        <Input id="className" placeholder="e.g., Modern History" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="division">Division</Label>
                        <Input id="division" placeholder="e.g., A" value={newClassDivision} onChange={(e) => setNewClassDivision(e.target.value)} />
                    </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <PlusCircle className="mr-2" />
                  Create Class
                </Button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.division}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setManagingClass(c)}><Settings className="mr-2 h-4 w-4" />Manage</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    {managingClass && (
      <ManageClassDialog
        classData={managingClass}
        allUsers={users}
        isOpen={!!managingClass}
        onClose={() => setManagingClass(null)}
        onSave={handleUpdateClass}
      />
    )}
    </>
  );
}

export default withAuth(AdminDashboard, ['admin']);
