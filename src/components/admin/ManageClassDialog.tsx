'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { UserProfile, Class as ClassType } from '@/lib/types';

type ManageClassDialogProps = {
  classData: ClassType;
  allUsers: UserProfile[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClass: ClassType) => void;
};

export function ManageClassDialog({
  classData,
  allUsers,
  isOpen,
  onClose,
  onSave,
}: ManageClassDialogProps) {
  const [teacherId, setTeacherId] = useState(classData.teacherId);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // When the dialog opens or the class data changes, update the internal state
  useEffect(() => {
    setTeacherId(classData.teacherId);
    setStudentIds(classData.studentIds || []);
  }, [classData, isOpen]);

  const teachers = allUsers.filter((user) => user.role === 'teacher');
  const allStudents = allUsers.filter((user) => user.role === 'student');

  const handleSave = () => {
    onSave({ ...classData, teacherId, studentIds });
  };
  
  const handleStudentCheckChange = (studentId: string, checked: boolean) => {
    setStudentIds((currentIds) => {
      if (checked) {
        return [...currentIds, studentId];
      } else {
        return currentIds.filter((id) => id !== studentId);
      }
    });
  };
  
  const filteredStudents = allStudents.filter(student => student.email.toLowerCase().includes(studentSearch.toLowerCase()));


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Class: {classData.name}</DialogTitle>
          <DialogDescription>Assign a teacher and manage student enrollment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacher" className="text-right">
              Teacher
            </Label>
            <Select value={teacherId || ''} onValueChange={(value) => setTeacherId(value === 'null' ? null : value)}>
              <SelectTrigger id="teacher" className="col-span-3">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">None</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.uid} value={teacher.uid}>
                    {teacher.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
             <Label className="text-right pt-2">
              Students
            </Label>
            <div className="col-span-3 space-y-3">
                <Input 
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                />
                <ScrollArea className="h-60 w-full rounded-md border">
                    <div className="p-4">
                        <h4 className="mb-4 text-sm font-medium leading-none">Available Students</h4>
                         {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <div key={student.uid} className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                        id={`student-${student.uid}`}
                                        checked={studentIds.includes(student.uid)}
                                        onCheckedChange={(checked) => handleStudentCheckChange(student.uid, !!checked)}
                                    />
                                    <Label htmlFor={`student-${student.uid}`} className="text-sm font-normal">
                                        {student.email}
                                    </Label>
                                </div>
                            ))
                         ) : (
                            <p className="text-sm text-muted-foreground">No students found.</p>
                         )}
                    </div>
                </ScrollArea>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
