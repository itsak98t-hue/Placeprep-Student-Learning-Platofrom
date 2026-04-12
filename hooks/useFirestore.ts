// hooks/useFirestore.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  getResumes,
  getAnswers,
  UserProfile,
  Resume,
  QuizAnswer,
} from "@/lib/firestore";

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);
  return user;
}

export function useUserProfile() {
  const user = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  return { profile, loading };
}

export function useResumes() {
  const user = useCurrentUser();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getResumes(user.uid).then((data) => {
      setResumes(data);
      setLoading(false);
    });
  }, [user]);

  return { resumes, loading };
}

export function useAnswers() {
  const user = useCurrentUser();
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAnswers(user.uid).then((data) => {
      setAnswers(data);
      setLoading(false);
    });
  }, [user]);

  return { answers, loading };
}