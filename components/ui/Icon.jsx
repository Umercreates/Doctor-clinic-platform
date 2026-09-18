import {
  Activity,
  Award,
  Bandage,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Eye,
  Heart,
  HeartHandshake,
  HeartPulse,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  Video,
} from "lucide-react";

/**
 * Maps icon keys stored in data (and later in the database) to icon
 * components. Keeping this mapping in one place lets content be edited in the
 * dashboard without shipping component code.
 */
const iconMap = {
  activity: Activity,
  award: Award,
  bandage: Bandage,
  building: Building2,
  "calendar-check": CalendarCheck,
  "calendar-days": CalendarDays,
  "clipboard-check": ClipboardCheck,
  clock: Clock,
  eye: Eye,
  heart: Heart,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  leaf: Leaf,
  "message-circle": MessageCircle,
  "shield-check": ShieldCheck,
  stethoscope: Stethoscope,
  "user-check": UserCheck,
  users: Users,
  video: Video,
};

export function Icon({ name, className, ...props }) {
  const Component = iconMap[name] || Stethoscope;
  return <Component className={className} aria-hidden="true" {...props} />;
}
