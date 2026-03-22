--
-- PostgreSQL database dump
--

\restrict faLAJfjqnMcjmaQaUCcWUrh6Gkm6Zq0MApVdE1TDJ3GN1AncUeJcIuO0mbRrh6l

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status AS ENUM (
    'booked',
    'cancelled',
    'completed',
    'pending'
);


ALTER TYPE public.appointment_status OWNER TO postgres;

--
-- Name: consultation_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.consultation_type AS ENUM (
    'offline',
    'online'
);


ALTER TYPE public.consultation_type OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_reminder',
    'payment_received',
    'review_received',
    'doctor_reply',
    'general'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'patient',
    'doctor',
    'hospital_admin',
    'super_admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id text NOT NULL,
    doctor_id integer NOT NULL,
    hospital_id integer NOT NULL,
    date date NOT NULL,
    time_slot text NOT NULL,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status NOT NULL,
    notes text,
    has_review boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    payment_id text,
    stripe_session_id text,
    consultation_type public.consultation_type DEFAULT 'offline'::public.consultation_type NOT NULL,
    meeting_link text,
    cashfree_order_id text
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    date date NOT NULL,
    time_slots text[] DEFAULT '{}'::text[] NOT NULL
);


ALTER TABLE public.availability OWNER TO postgres;

--
-- Name: availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.availability_id_seq OWNER TO postgres;

--
-- Name: availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.availability_id_seq OWNED BY public.availability.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    icon text
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    user_id text NOT NULL,
    hospital_id integer NOT NULL,
    department_id integer NOT NULL,
    experience integer DEFAULT 0 NOT NULL,
    consultation_fee real DEFAULT 0 NOT NULL,
    average_rating real DEFAULT 0 NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    bio text,
    specialization text,
    qualification text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    first_name text,
    last_name text
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_id_seq OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitals (
    id integer NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    phone text,
    email text,
    description text,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    latitude double precision,
    longitude double precision
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitals_id_seq OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_id_seq OWNED BY public.hospitals.id;


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_records (
    id integer NOT NULL,
    patient_id text NOT NULL,
    doctor_id integer,
    appointment_id integer,
    title text NOT NULL,
    description text,
    file_url text,
    file_type text,
    diagnosis text,
    prescription text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medical_records OWNER TO postgres;

--
-- Name: medical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_records_id_seq OWNER TO postgres;

--
-- Name: medical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_records_id_seq OWNED BY public.medical_records.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id text NOT NULL,
    type public.notification_type DEFAULT 'general'::public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    patient_id text NOT NULL,
    doctor_id integer NOT NULL,
    appointment_id integer,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    verified_patient boolean DEFAULT false NOT NULL,
    doctor_reply text,
    doctor_reply_at timestamp without time zone
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    replit_user_id text,
    role public.user_role DEFAULT 'patient'::public.user_role NOT NULL,
    hospital_id integer,
    doctor_id integer,
    phone character varying,
    password_hash character varying,
    reset_token character varying,
    reset_token_expires timestamp with time zone,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: availability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability ALTER COLUMN id SET DEFAULT nextval('public.availability_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: hospitals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN id SET DEFAULT nextval('public.hospitals_id_seq'::regclass);


--
-- Name: medical_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN id SET DEFAULT nextval('public.medical_records_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, patient_id, doctor_id, hospital_id, date, time_slot, status, notes, has_review, created_at, payment_status, payment_id, stripe_session_id, consultation_type, meeting_link, cashfree_order_id) FROM stdin;
2	test-auth-review-005	15	7	2026-03-23	09:30 AM	booked	\N	f	2026-03-21 20:33:37.342188	pending	\N	\N	offline	\N	\N
3	test-patient-final-001	20	8	2026-03-24	09:00 AM	cancelled	\N	f	2026-03-21 20:43:33.170817	pending	\N	\N	offline	\N	\N
4	seed-patient-1	13	7	2026-03-11	09:00 AM	completed	Follow-up on ECG results	f	2026-03-21 20:50:50.368387	pending	\N	\N	offline	\N	\N
5	seed-patient-1	14	8	2026-03-16	10:00 AM	completed	Skin rash evaluation	f	2026-03-21 20:50:50.371757	pending	\N	\N	offline	\N	\N
6	seed-patient-2	15	7	2026-03-14	09:30 AM	completed	Annual skin check	f	2026-03-21 20:50:50.374378	pending	\N	\N	offline	\N	\N
7	seed-patient-2	17	8	2026-03-18	11:00 AM	booked	Headache and dizziness	f	2026-03-21 20:50:50.377033	pending	\N	\N	offline	\N	\N
8	seed-patient-3	18	7	2026-03-07	02:00 PM	completed	Lower back pain	f	2026-03-21 20:50:50.379823	pending	\N	\N	offline	\N	\N
9	seed-patient-3	19	9	2026-03-19	09:00 AM	pending	Child checkup	f	2026-03-21 20:50:50.382712	pending	\N	\N	offline	\N	\N
11	seed-patient-1	13	7	2026-03-11	09:00 AM	completed	Follow-up on ECG results	f	2026-03-21 21:25:35.856541	pending	\N	\N	offline	\N	\N
12	seed-patient-1	14	8	2026-03-16	10:00 AM	completed	Skin rash evaluation	f	2026-03-21 21:25:35.859682	pending	\N	\N	offline	\N	\N
13	seed-patient-2	15	7	2026-03-14	09:30 AM	completed	Annual skin check	f	2026-03-21 21:25:35.862089	pending	\N	\N	offline	\N	\N
15	seed-patient-3	18	7	2026-03-07	02:00 PM	completed	Lower back pain	f	2026-03-21 21:25:35.866107	pending	\N	\N	offline	\N	\N
\.


--
-- Data for Name: availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability (id, doctor_id, date, time_slots) FROM stdin;
1	1	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
2	1	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
3	1	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
4	1	2026-03-26	{"09:00 AM","09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
5	1	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
6	2	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
7	2	2026-03-24	{"09:00 AM","09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
8	2	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
9	2	2026-03-26	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
10	2	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
11	3	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
12	3	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
13	3	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
14	3	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
15	3	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
16	4	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
17	4	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
18	4	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","04:00 PM"}
19	4	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
20	4	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
21	5	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
22	5	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
23	5	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
24	5	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
25	5	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
26	6	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
27	6	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
28	6	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
29	6	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
30	6	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
31	7	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
32	7	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
33	7	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
34	7	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM"}
35	7	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
36	8	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
37	8	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
38	8	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
39	8	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM"}
40	8	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
41	9	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
42	9	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
43	9	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
44	9	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
45	9	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
46	10	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
47	10	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
48	10	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
49	10	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM"}
50	10	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
51	11	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
52	11	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
53	11	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
54	11	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
55	11	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
56	12	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
57	12	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
58	12	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
59	12	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM"}
60	12	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
61	13	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
62	13	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
63	13	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
64	13	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
65	13	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
66	14	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","04:00 PM"}
67	14	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
68	14	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
69	14	2026-03-26	{"09:00 AM","09:30 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM"}
70	14	2026-03-27	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
71	15	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
72	15	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
73	15	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
74	15	2026-03-26	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
75	15	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
76	16	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
77	16	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
78	16	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
79	16	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
80	16	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
81	17	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
82	17	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
83	17	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
84	17	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
85	17	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
86	18	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
87	18	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
88	18	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
89	18	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM"}
90	18	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
91	19	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
92	19	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
93	19	2026-03-25	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
94	19	2026-03-26	{"09:00 AM","09:30 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
95	19	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
96	20	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
97	20	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
98	20	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","04:00 PM"}
99	20	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
100	20	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
101	21	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
102	21	2026-03-24	{"09:30 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM"}
103	21	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
104	21	2026-03-26	{"09:00 AM","09:30 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
105	21	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
106	22	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
107	22	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
108	22	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
109	22	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
110	22	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
111	23	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
112	23	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
113	23	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
114	23	2026-03-26	{"09:30 AM","10:30 AM","02:00 PM","03:00 PM"}
115	23	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
116	24	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
117	24	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
118	24	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
119	24	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
120	24	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
121	25	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
122	25	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
123	25	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
124	25	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
125	25	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
126	26	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
127	26	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
128	26	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
129	26	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
130	26	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
131	27	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
132	27	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
133	27	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
134	27	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
135	27	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
136	28	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:30 PM","04:00 PM"}
137	28	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
138	28	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
139	28	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
140	28	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
141	29	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
142	29	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
143	29	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
144	29	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
145	29	2026-03-27	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
146	30	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
147	30	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
148	30	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
149	30	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
150	30	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
151	31	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
152	31	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
153	31	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
154	31	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
155	31	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
156	32	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
157	32	2026-03-24	{"09:00 AM","09:30 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
158	32	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
159	32	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
160	32	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
161	33	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
162	33	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
163	33	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
164	33	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
165	33	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
166	34	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
167	34	2026-03-24	{"09:30 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
168	34	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
169	34	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
170	34	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
171	35	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
172	35	2026-03-24	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
173	35	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
174	35	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM"}
175	35	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
176	36	2026-03-23	{"09:00 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
177	36	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
178	36	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
179	36	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM"}
180	36	2026-03-27	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
181	37	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","04:00 PM"}
182	37	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
183	37	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
184	37	2026-03-26	{"09:00 AM","09:30 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
185	37	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
186	38	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
187	38	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
188	38	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
189	38	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
190	38	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
191	39	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
192	39	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
193	39	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
194	39	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
195	39	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
196	40	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
197	40	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
198	40	2026-03-25	{"09:00 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
199	40	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
200	40	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
201	41	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
202	41	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
203	41	2026-03-25	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
204	41	2026-03-26	{"09:30 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
205	41	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
206	42	2026-03-23	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
207	42	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
208	42	2026-03-25	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
209	42	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
210	42	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
211	43	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
212	43	2026-03-24	{"09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM","04:00 PM"}
213	43	2026-03-25	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
214	43	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","03:00 PM"}
215	43	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
216	44	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
217	44	2026-03-24	{"09:00 AM","09:30 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
218	44	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
219	44	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
220	44	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
221	45	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","04:00 PM"}
222	45	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
223	45	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
224	45	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
225	45	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
226	46	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
227	46	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
228	46	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
229	46	2026-03-26	{"09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM"}
230	46	2026-03-27	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
231	47	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
232	47	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM"}
233	47	2026-03-25	{"09:00 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
234	47	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM","04:00 PM"}
235	47	2026-03-27	{"09:00 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
236	48	2026-03-23	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:30 PM","04:00 PM"}
237	48	2026-03-24	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","03:00 PM"}
238	48	2026-03-25	{"09:00 AM","09:30 AM","10:00 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
239	48	2026-03-26	{"09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","04:00 PM"}
240	48	2026-03-27	{"09:00 AM","10:00 AM","11:00 AM","02:30 PM","03:00 PM","04:00 PM"}
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description, icon) FROM stdin;
1	Cardiology	Heart and cardiovascular system	Heart
2	Dermatology	Skin, hair, and nails	Sparkles
3	Neurology	Brain and nervous system	Brain
4	Orthopedics	Bones, joints, and muscles	Bone
5	Pediatrics	Medical care for children	Baby
6	Ophthalmology	Eyes and vision care	Eye
7	Gynecology	Women's reproductive health	Activity
8	General Medicine	Primary care and general health	Stethoscope
9	Dentistry	Oral health and dental care	Smile
10	Psychiatry	Mental health and behavioral disorders	Brain
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, user_id, hospital_id, department_id, experience, consultation_fee, average_rating, total_reviews, bio, specialization, qualification, created_at, first_name, last_name) FROM stdin;
13	seed-doctor-1	7	1	15	150	4.8	52	Expert in minimally invasive cardiac procedures with 15+ years of experience.	Interventional Cardiology	MD, FACC	2026-03-21 20:07:12.239933	James	Wilson
14	seed-doctor-2	8	1	12	140	4.6	34	Specialized in heart rhythm disorders and cardiac ablation procedures.	Electrophysiology	MD, PhD	2026-03-21 20:07:12.258501	Emily	Chen
15	seed-doctor-3	7	2	10	120	4.9	78	Board-certified dermatologist specializing in skin cancer and cosmetic treatments.	Clinical Dermatology	MD, FAAD	2026-03-21 20:07:12.275479	Robert	Patel
16	seed-doctor-4	9	2	8	130	4.3	18	Expert in laser treatments, fillers, and advanced skincare procedures.	Cosmetic Dermatology	MD	2026-03-21 20:07:12.291944	Sarah	Johnson
17	seed-doctor-5	8	3	20	160	4.7	65	Leading neurologist with expertise in epilepsy management and neurological disorders.	Neurology & Epilepsy	MD, DM Neurology	2026-03-21 20:07:12.30798	Michael	Davis
18	seed-doctor-6	7	4	18	200	4.5	45	Orthopedic surgeon specializing in complex spine surgeries and joint replacements.	Spine Surgery	MS Orthopedics, FRCS	2026-03-21 20:07:12.324051	Priya	Sharma
19	seed-doctor-7	9	5	14	110	4.4	12	Dedicated to providing comprehensive cardiac care for children from birth to 18.	Pediatric Cardiology	MD, DNB Pediatrics	2026-03-21 20:07:12.34899	Thomas	Anderson
20	seed-doctor-8	8	6	16	175	4.8	89	Expert in vitreoretinal surgery and treatment of complex retinal diseases.	Retinal Surgery	MS Ophthalmology, FVRS	2026-03-21 20:07:12.369628	Aisha	Khan
21	seed-doctor-9	7	7	11	135	4.2	9	Specialist in fertility treatments, IVF, and women's reproductive health.	Reproductive Medicine	MD, MRCOG	2026-03-21 20:07:12.385984	David	Lee
22	seed-doctor-10	9	8	9	80	4.6	37	Compassionate primary care physician providing comprehensive healthcare for all ages.	Family Medicine	MD, MBBS	2026-03-21 20:07:12.406848	Maria	Garcia
23	seed-doctor-11	8	9	7	90	4.1	6	Specialist in root canal treatments and complex dental procedures.	Endodontics	BDS, MDS	2026-03-21 20:07:12.424736	Kevin	Brown
24	seed-doctor-12	7	10	13	145	4.5	28	Psychiatrist specializing in anxiety, depression, and behavioral disorders.	Cognitive Behavioral Therapy	MD Psychiatry	2026-03-21 20:07:12.441858	Lisa	Martinez
25	seed-doctor-1	10	1	15	150	4.8	52	Expert in minimally invasive cardiac procedures with 15+ years of experience.	Interventional Cardiology	MD, FACC	2026-03-21 20:50:50.155553	James	Wilson
26	seed-doctor-2	11	1	12	140	4.6	34	Specialized in heart rhythm disorders and cardiac ablation procedures.	Electrophysiology	MD, PhD	2026-03-21 20:50:50.175752	Emily	Chen
27	seed-doctor-3	10	2	10	120	4.9	78	Board-certified dermatologist specializing in skin cancer and cosmetic treatments.	Clinical Dermatology	MD, FAAD	2026-03-21 20:50:50.193488	Robert	Patel
28	seed-doctor-4	12	2	8	130	4.3	18	Expert in laser treatments, fillers, and advanced skincare procedures.	Cosmetic Dermatology	MD	2026-03-21 20:50:50.211073	Sarah	Johnson
29	seed-doctor-5	11	3	20	160	4.7	65	Leading neurologist with expertise in epilepsy management and neurological disorders.	Neurology & Epilepsy	MD, DM Neurology	2026-03-21 20:50:50.226146	Michael	Davis
30	seed-doctor-6	10	4	18	200	4.5	45	Orthopedic surgeon specializing in complex spine surgeries and joint replacements.	Spine Surgery	MS Orthopedics, FRCS	2026-03-21 20:50:50.249048	Priya	Sharma
31	seed-doctor-7	12	5	14	110	4.4	12	Dedicated to providing comprehensive cardiac care for children from birth to 18.	Pediatric Cardiology	MD, DNB Pediatrics	2026-03-21 20:50:50.265314	Thomas	Anderson
32	seed-doctor-8	11	6	16	175	4.8	89	Expert in vitreoretinal surgery and treatment of complex retinal diseases.	Retinal Surgery	MS Ophthalmology, FVRS	2026-03-21 20:50:50.283096	Aisha	Khan
33	seed-doctor-9	10	7	11	135	4.2	9	Specialist in fertility treatments, IVF, and women's reproductive health.	Reproductive Medicine	MD, MRCOG	2026-03-21 20:50:50.299143	David	Lee
34	seed-doctor-10	12	8	9	80	4.6	37	Compassionate primary care physician providing comprehensive healthcare for all ages.	Family Medicine	MD, MBBS	2026-03-21 20:50:50.312417	Maria	Garcia
35	seed-doctor-11	11	9	7	90	4.1	6	Specialist in root canal treatments and complex dental procedures.	Endodontics	BDS, MDS	2026-03-21 20:50:50.327358	Kevin	Brown
36	seed-doctor-12	10	10	13	145	4.5	28	Psychiatrist specializing in anxiety, depression, and behavioral disorders.	Cognitive Behavioral Therapy	MD Psychiatry	2026-03-21 20:50:50.343365	Lisa	Martinez
37	seed-doctor-1	13	1	15	150	4.8	52	Expert in minimally invasive cardiac procedures with 15+ years of experience.	Interventional Cardiology	MD, FACC	2026-03-21 21:25:35.592138	James	Wilson
38	seed-doctor-2	14	1	12	140	4.6	34	Specialized in heart rhythm disorders and cardiac ablation procedures.	Electrophysiology	MD, PhD	2026-03-21 21:25:35.617846	Emily	Chen
39	seed-doctor-3	13	2	10	120	4.9	78	Board-certified dermatologist specializing in skin cancer and cosmetic treatments.	Clinical Dermatology	MD, FAAD	2026-03-21 21:25:35.640381	Robert	Patel
40	seed-doctor-4	15	2	8	130	4.3	18	Expert in laser treatments, fillers, and advanced skincare procedures.	Cosmetic Dermatology	MD	2026-03-21 21:25:35.663306	Sarah	Johnson
41	seed-doctor-5	14	3	20	160	4.7	65	Leading neurologist with expertise in epilepsy management and neurological disorders.	Neurology & Epilepsy	MD, DM Neurology	2026-03-21 21:25:35.684891	Michael	Davis
42	seed-doctor-6	13	4	18	200	4.5	45	Orthopedic surgeon specializing in complex spine surgeries and joint replacements.	Spine Surgery	MS Orthopedics, FRCS	2026-03-21 21:25:35.708681	Priya	Sharma
43	seed-doctor-7	15	5	14	110	4.4	12	Dedicated to providing comprehensive cardiac care for children from birth to 18.	Pediatric Cardiology	MD, DNB Pediatrics	2026-03-21 21:25:35.729623	Thomas	Anderson
44	seed-doctor-8	14	6	16	175	4.8	89	Expert in vitreoretinal surgery and treatment of complex retinal diseases.	Retinal Surgery	MS Ophthalmology, FVRS	2026-03-21 21:25:35.750491	Aisha	Khan
45	seed-doctor-9	13	7	11	135	4.2	9	Specialist in fertility treatments, IVF, and women's reproductive health.	Reproductive Medicine	MD, MRCOG	2026-03-21 21:25:35.770841	David	Lee
46	seed-doctor-10	15	8	9	80	4.6	37	Compassionate primary care physician providing comprehensive healthcare for all ages.	Family Medicine	MD, MBBS	2026-03-21 21:25:35.792289	Maria	Garcia
47	seed-doctor-11	14	9	7	90	4.1	6	Specialist in root canal treatments and complex dental procedures.	Endodontics	BDS, MDS	2026-03-21 21:25:35.813518	Kevin	Brown
48	seed-doctor-12	13	10	13	145	4.5	28	Psychiatrist specializing in anxiety, depression, and behavioral disorders.	Cognitive Behavioral Therapy	MD Psychiatry	2026-03-21 21:25:35.834809	Lisa	Martinez
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (id, name, location, approved, phone, email, description, image_url, created_at, latitude, longitude) FROM stdin;
1	City Medical Center	123 Main St, Downtown, NY 10001	t	+1-555-0101	info@citymedical.com	A leading multi-specialty hospital serving the city for over 50 years.	\N	2026-03-21 20:04:24.557813	40.7128	-74.006
4	City Medical Center	123 Main St, Downtown, NY 10001	t	+1-555-0101	info@citymedical.com	A leading multi-specialty hospital serving the city for over 50 years.	\N	2026-03-21 20:06:54.368497	40.7128	-74.006
7	City Medical Center	123 Main St, Downtown, NY 10001	t	+1-555-0101	info@citymedical.com	A leading multi-specialty hospital serving the city for over 50 years.	\N	2026-03-21 20:07:12.233413	40.7128	-74.006
10	City Medical Center	123 Main St, Downtown, NY 10001	t	+1-555-0101	info@citymedical.com	A leading multi-specialty hospital serving the city for over 50 years.	\N	2026-03-21 20:50:50.148675	40.7128	-74.006
13	City Medical Center	123 Main St, Downtown, NY 10001	t	+1-555-0101	info@citymedical.com	A leading multi-specialty hospital serving the city for over 50 years.	\N	2026-03-21 21:25:35.573455	40.7128	-74.006
2	Green Valley Hospital	456 Oak Avenue, Green Valley, CA 90210	t	+1-555-0202	contact@greenvalley.com	State-of-the-art facility with world-class specialists.	\N	2026-03-21 20:04:24.557813	34.0522	-118.2437
5	Green Valley Hospital	456 Oak Avenue, Green Valley, CA 90210	t	+1-555-0202	contact@greenvalley.com	State-of-the-art facility with world-class specialists.	\N	2026-03-21 20:06:54.368497	34.0522	-118.2437
8	Green Valley Hospital	456 Oak Avenue, Green Valley, CA 90210	t	+1-555-0202	contact@greenvalley.com	State-of-the-art facility with world-class specialists.	\N	2026-03-21 20:07:12.233413	34.0522	-118.2437
11	Green Valley Hospital	456 Oak Avenue, Green Valley, CA 90210	t	+1-555-0202	contact@greenvalley.com	State-of-the-art facility with world-class specialists.	\N	2026-03-21 20:50:50.148675	34.0522	-118.2437
14	Green Valley Hospital	456 Oak Avenue, Green Valley, CA 90210	t	+1-555-0202	contact@greenvalley.com	State-of-the-art facility with world-class specialists.	\N	2026-03-21 21:25:35.573455	34.0522	-118.2437
3	Sunrise Health Clinic	789 Sunrise Blvd, Miami, FL 33101	t	+1-555-0303	hello@sunrisehealth.com	Comprehensive outpatient care with compassionate service.	\N	2026-03-21 20:04:24.557813	25.7617	-80.1918
6	Sunrise Health Clinic	789 Sunrise Blvd, Miami, FL 33101	t	+1-555-0303	hello@sunrisehealth.com	Comprehensive outpatient care with compassionate service.	\N	2026-03-21 20:06:54.368497	25.7617	-80.1918
9	Sunrise Health Clinic	789 Sunrise Blvd, Miami, FL 33101	t	+1-555-0303	hello@sunrisehealth.com	Comprehensive outpatient care with compassionate service.	\N	2026-03-21 20:07:12.233413	25.7617	-80.1918
12	Sunrise Health Clinic	789 Sunrise Blvd, Miami, FL 33101	t	+1-555-0303	hello@sunrisehealth.com	Comprehensive outpatient care with compassionate service.	\N	2026-03-21 20:50:50.148675	25.7617	-80.1918
15	Sunrise Health Clinic	789 Sunrise Blvd, Miami, FL 33101	t	+1-555-0303	hello@sunrisehealth.com	Comprehensive outpatient care with compassionate service.	\N	2026-03-21 21:25:35.573455	25.7617	-80.1918
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_records (id, patient_id, doctor_id, appointment_id, title, description, file_url, file_type, diagnosis, prescription, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, read, link, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, patient_id, doctor_id, appointment_id, rating, comment, created_at, verified_patient, doctor_reply, doctor_reply_at) FROM stdin;
1	seed-patient-1	13	4	4	Excellent doctor, very thorough and caring. Highly recommend!	2026-03-21 20:50:50.385534	f	\N	\N
2	seed-patient-1	13	5	5	Great experience, explained everything clearly and patiently.	2026-03-21 20:50:50.388306	f	\N	\N
3	seed-patient-2	15	6	4	Very professional, diagnosis was spot on. Will visit again.	2026-03-21 20:50:50.390947	f	\N	\N
4	seed-patient-1	13	11	4	Excellent doctor, very thorough and caring. Highly recommend!	2026-03-21 21:25:35.869304	f	\N	\N
5	seed-patient-1	13	12	5	Great experience, explained everything clearly and patiently.	2026-03-21 21:25:35.871492	f	\N	\N
6	seed-patient-2	15	13	4	Very professional, diagnosis was spot on. Will visit again.	2026-03-21 21:25:35.87473	f	\N	\N
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
d55e99ce873d8a36889ecd789ab0bd6f99248627183366afced19d4a463d359a	{"user": {"id": "ljaSKj", "email": "ljaSKj@example.com", "lastName": "Doe", "firstName": "John", "profileImageUrl": null}, "expires_at": 1774127546, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTIzOTQ3LCJleHAiOjE3NzQxMjc1NDcsInN1YiI6ImxqYVNLaiIsImVtYWlsIjoibGphU0tqQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.Iv5Vp1UDSW3F5SyDJ0Am2UqjkY3rzrbAkMTCQvTn8vKtJkccfCgKwyZScL1d_qOXXwYET_A6aFshWpyH-_7ZMwM7yNdkNqWRzxS1vcOgekvBY8MFnFynDfLVnTFFGaNb7LEm03cyj0wvZ_xcmXDpRijletjEO_SrT9YMlXQzSoizMzIRK4B2C5VN05FZCLjTT5MORLZ6U49vW7B-4xAkqi5HRE8jwLCrEWw4c17vUnbOZ9QqwGzQ3u8fyF34QBGmZbq-ytiFObqGXJquzv4mAejhyxFcT30kxPfsvHjN_V693tddeY2FQAzYodOfxWSFf86DjnSD7gHRBltokcBp-Q", "refresh_token": "eyJzdWIiOiJsamFTS2oiLCJlbWFpbCI6ImxqYVNLakBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}	2026-03-28 20:12:27.576
15da0a59e9ddeb914bd0fc94b08d4e20a2d3a281a5bd2f7996db093080ea5a13	{"user": {"id": "test-patient-001", "email": "patient001@test.com", "lastName": "Smith", "firstName": "Alice", "profileImageUrl": null}, "expires_at": 1774127595, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTIzOTk2LCJleHAiOjE3NzQxMjc1OTYsInN1YiI6InRlc3QtcGF0aWVudC0wMDEiLCJlbWFpbCI6InBhdGllbnQwMDFAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQWxpY2UiLCJsYXN0X25hbWUiOiJTbWl0aCJ9.ZOM2tu92gEILiF6_QeUnDj4mp7tU7tw3mzXms-IELxwneNn2ScuTNOdDNZlGDhghaCza8ngys6Iaz6q6o0dV96VEnSRmdA0KVXNrD-jZLt3NfsDWraTkCzw2uk_a0DU-kNE8lxv2QZbHiVNB8dFXHy38sb8WugMJTEA9FwLPRf27vi0JuJAD8ZTS9Y-ZOOqGCVqPjUx8P2A8UNvransHZQCe6hR8c7gYSV32xM-0hfnMLZE6cvNdMQ1m9j7Ff3dA_PNnl28lAIxTIjAZzb0oXT6enQEDMsKvH1JHBcKFEniEIR-8yBLd4B5vbeVP2wlD5k59ISVOxweP8FSsh5rCXg", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBhdGllbnQtMDAxIiwiZW1haWwiOiJwYXRpZW50MDAxQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkFsaWNlIiwibGFzdF9uYW1lIjoiU21pdGgifQ"}	2026-03-28 20:13:16.091
f75a88d7fab876121aebb9f455e04339688c6efcd3c2a4351ef53665850e3260	{"user": {"id": "test-patient-002", "email": "patient002@test.com", "lastName": "Jones", "firstName": "Bob", "profileImageUrl": null}, "expires_at": 1774127674, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI0MDc1LCJleHAiOjE3NzQxMjc2NzUsInN1YiI6InRlc3QtcGF0aWVudC0wMDIiLCJlbWFpbCI6InBhdGllbnQwMDJAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQm9iIiwibGFzdF9uYW1lIjoiSm9uZXMifQ.Y0LBKPjP25ddBktLPToJeSxlEiK14ARPqLNi9rpOY2F9RyVrfCIaw4WxYR95V-ea9SnOEdCCLeNFa9LjLpit4P13i1zrm-je1ByHElH19-b8XzCPEEKLkb_35HQGlDJrCqVp-kN9LVbY8PrUO9KIMdXSB3Hc1CIat24f1gt8QXzLTMEv51D0E6exWl278XOs3v0HYhL3eTeGMvTFuGBBA6Vqot0JGIb1kVD-c7XVa2wZ_UFu5c3S89ljeGG5zTAeZiast2MI-vCpLm3j2kAwEuJn6MTQMmyZiQOXCf8yoe21H7ppeFkP8jTFPsyXU-MTRrsTHQg9mzLAqnxnlUTc4w", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBhdGllbnQtMDAyIiwiZW1haWwiOiJwYXRpZW50MDAyQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkJvYiIsImxhc3RfbmFtZSI6IkpvbmVzIn0"}	2026-03-28 20:14:35.184
f37bc94ec8a6b8a92ecdad7040b6392a51386389f1aa0583ab74ad6b5e874e78	{"user": {"id": "test-patient-003", "email": "patient003@test.com", "lastName": "Brown", "firstName": "Charlie", "profileImageUrl": null}, "expires_at": 1774127873, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI0Mjc0LCJleHAiOjE3NzQxMjc4NzQsInN1YiI6InRlc3QtcGF0aWVudC0wMDMiLCJlbWFpbCI6InBhdGllbnQwMDNAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQ2hhcmxpZSIsImxhc3RfbmFtZSI6IkJyb3duIn0.TJ_vImL6LHN61tRPza1E4KyUppTqlpJVscmg4wZ2EgHj02uLnLU38hj-5jcpLv0UnJjbcMnA9JIctwte99W_pafcSaOUIUrvveIt-Ne2VRoeeAzfZBeE2a7O_NBdKHdL-RR-zhsuvi_HXF1ndZvvgIiJFhrEjMZGxpQaqPJnU8fkSKsjmldYBqqQk3iO7cVfHOEKPxnG3Qyfolh-rq721cn0RNhvZIb_-V_MLp3b4XHW2qi-ZMEr22TQESdhm3ASogqqnVch0pg55ZZA6lXqRlfewepfmogwOMXboby4gEvEAZZ_apP1mvpiR0nKw5JIV32KIyiBxSwxWY7f0bDhjg", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBhdGllbnQtMDAzIiwiZW1haWwiOiJwYXRpZW50MDAzQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkNoYXJsaWUiLCJsYXN0X25hbWUiOiJCcm93biJ9"}	2026-03-28 20:17:54.128
4a0da9528a9d8ee54b8352cd8f1dd08d4afdfe104f7ec08496c0b149fe40b7e5	{"user": {"id": "test-patient-004", "email": "patient004@test.com", "lastName": "Prince", "firstName": "Diana", "profileImageUrl": null}, "expires_at": 1774127961, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI0MzYyLCJleHAiOjE3NzQxMjc5NjIsInN1YiI6InRlc3QtcGF0aWVudC0wMDQiLCJlbWFpbCI6InBhdGllbnQwMDRAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRGlhbmEiLCJsYXN0X25hbWUiOiJQcmluY2UifQ.LSvRGz4eR2OlHMGGzTbcSTVJDeQbp74QXBldkMbeOh2qtzFcHCvhWQPgWOsF4Q7GbgEwZmpBUHiW9JqO79ONP382hSa6K05pAAKOzlvB1Fle2Af5hoQiP0aawgvE_UCNHfKTfrTUZlkn4QIcZ7rv7AavWp7dXAdoblX-GtGmbSGkQdb1LHETmfcbPsQYpqggqpGR7j63on9ZQ7C3yDoZbRQc6aO8DKL7CVRS-IZECbwKKEeuVbi0YdtiuhfWKJWzJXMq5wW3U1_9QD2PHD7h94CPWiC_G-QDmfe8EmO_GY0u2s-Ui1WIno9g1lCqJDyKOaZfQ8W7WUuksDkmLprS_A", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBhdGllbnQtMDA0IiwiZW1haWwiOiJwYXRpZW50MDA0QHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkRpYW5hIiwibGFzdF9uYW1lIjoiUHJpbmNlIn0"}	2026-03-28 20:19:22.359
16d0e928d55b4f645e669568ccbf0c423ad3288fa4f3ebce8265fea99a998fb1	{"user": {"id": "test-auth-review-005", "role": "patient", "email": "patient005@test.com", "doctorId": null, "lastName": "Adams", "firstName": "Eve", "hospitalId": null, "profileImageUrl": null}, "expires_at": 1774128761, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI1MTYyLCJleHAiOjE3NzQxMjg3NjIsInN1YiI6InRlc3QtYXV0aC1yZXZpZXctMDA1IiwiZW1haWwiOiJwYXRpZW50MDA1QHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkV2ZSIsImxhc3RfbmFtZSI6IkFkYW1zIn0.pUCbXhiBWoms0_UmkyzBG0Nwi4gRnoRlDzcqkixkMqz_2IUnwQjc16z2b8G8kJWexeK88nA-4wyq2oG8lLzXDWreXR1q5IRWDX2kqQr2TWztBrlltGyD3xmy5KwWy2t9Wr5jDs2C9410m3O3WvZ0g1O0ROm0rHMAaGl2IX3HimHULYQJyYbCvSpuZSFIKVYNVE36YU6gKx8cOqvm7yH8rdhVNqFkhw9k--Oqs78RVYkvmnVbXxk1RYQKkmfwteiNiDnupmK20ijhUvbGccazh7CQ8J0ovdmXFqDSWaia9Iamm_XKw5f6SFx2dDrqDHUIOZt0REC0iYZj6s3JvrsQAQ", "refresh_token": "eyJzdWIiOiJ0ZXN0LWF1dGgtcmV2aWV3LTAwNSIsImVtYWlsIjoicGF0aWVudDAwNUB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJFdmUiLCJsYXN0X25hbWUiOiJBZGFtcyJ9"}	2026-03-28 20:32:42.303
5e505d58a801f796acbda0aee8c7976b978444b980b7df08d3f6dec4893d23bd	{"user": {"id": "test-patient-final-001", "role": "patient", "email": "finaltest001@test.com", "doctorId": null, "lastName": "Test", "firstName": "Final", "hospitalId": null, "profileImageUrl": null}, "expires_at": 1774129298, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI1Njk5LCJleHAiOjE3NzQxMjkyOTksInN1YiI6InRlc3QtcGF0aWVudC1maW5hbC0wMDEiLCJlbWFpbCI6ImZpbmFsdGVzdDAwMUB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJGaW5hbCIsImxhc3RfbmFtZSI6IlRlc3QifQ.xGqV6rVyyoivh1fx6orI6ln9XUiCmMJS769q0cUOqiVnLl85_zT-xaBgFJWEGMaOZTvLHaePM18ZRm9_HJU39doGMbVv9d1pCpPGPVp4uyIudM8O9NjtDlyD70JIERZnC46jWp-DPjyk3lq0_ijf5N_xVEHUxbFMm5gJNCM2lY_Z-2lOjAoPUkbaTZfE0CPHzJnWZcYma1lX6NQV7zqEgqKhB3fFCSU6P7GTGXbboaU5rS4P_V3wbTzh4QQiKxl0aQuJcFJf7hyBFRT_eIlnRyMP0UC4agoGJesyH9iPS_XSDDPOTtOXyGNXUdnV8pQfB7RJywH7w1Z_PzpvXrzLiw", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBhdGllbnQtZmluYWwtMDAxIiwiZW1haWwiOiJmaW5hbHRlc3QwMDFAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRmluYWwiLCJsYXN0X25hbWUiOiJUZXN0In0"}	2026-03-28 20:41:39.109
d8f25f4b46543fa11c39780ab4af383a4be92b193f6985b60fd4da4a814d9871	{"user": {"id": "e2e-patient-main-001", "role": "patient", "email": "e2e.patient@test.com", "doctorId": null, "lastName": "Patient", "firstName": "Emma", "hospitalId": null, "profileImageUrl": null}, "expires_at": 1774130018, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI2NDE5LCJleHAiOjE3NzQxMzAwMTksInN1YiI6ImUyZS1wYXRpZW50LW1haW4tMDAxIiwiZW1haWwiOiJlMmUucGF0aWVudEB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJFbW1hIiwibGFzdF9uYW1lIjoiUGF0aWVudCJ9.DaMwtpgg9lv51SEORn443cwqfpuJ0MQv4FpVmDiX9ggWVSpGmwJEoAz1_YRWpT4T_z0OLkOPj1BQqJcWnHLBCU8UWoiTRZpsrvEfYeKgSebUiznV7EfBwrcxH_k2YmzVKRElbEKhhWsIHbijPWgk1UEuMwJWGnPwS5Gt8DdwbihoubT6o7ouu4OIs38MBiOFTK07mTLH8iIO_T1TzAfs9wdXlAqBVzlfXehhMlj9OnTyIYGHLwyks9CmhDkWvjcSuxM3EIvSy8HCSqfboLObqy35lBFSFCLPWfVNge71tWSpe11Gx_e5Ri7gvElnnCz9YaAvYpFGg4Z26OIofTvY0w", "refresh_token": "eyJzdWIiOiJlMmUtcGF0aWVudC1tYWluLTAwMSIsImVtYWlsIjoiZTJlLnBhdGllbnRAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRW1tYSIsImxhc3RfbmFtZSI6IlBhdGllbnQifQ"}	2026-03-28 20:53:39.991
f0eeefbe498572381d7e59b6cc64fd9d6a01cc36ad96bb992ea399fdd6ff8cb4	{"user": {"id": "main-patient-test-e2e-007", "role": "patient", "email": "e2e.patient.007@test.com", "doctorId": null, "lastName": "Patient", "firstName": "Emma", "hospitalId": null, "profileImageUrl": null}, "expires_at": 1774130162, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzc0MTI2NTYzLCJleHAiOjE3NzQxMzAxNjMsInN1YiI6Im1haW4tcGF0aWVudC10ZXN0LWUyZS0wMDciLCJlbWFpbCI6ImUyZS5wYXRpZW50LjAwN0B0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJFbW1hIiwibGFzdF9uYW1lIjoiUGF0aWVudCJ9.ihZxVi4uNukm0vTnZaq1M602iL6DzmcWuEuKCabo1dalvScs9lxEtJmZxhTxj4wc_kzrxIvBQHDQYZvH4ZPM8iKiJOFtdVlOFjzIfS29erDN1EeTrub-rRv5cbryFx06AlPRIm-rcBqZ9ibmvGlrr8jZpf9wPtPfPl7joVMPNqJ5ZE_7CrYt22DKb_kUocy9ddQX_LPEqggsQcLWQUVkU9s6UE6wHa9ZkfyUTH5SmgvL80VS66Z_un8nneksi_40upI1oMg9xaZppNBwHEHt9ataUDQ2cR9YiqsG1IJzA5kLvtzLBWVnHlKIZsHw2dbCioy_g7mkv6XC4lHD2nEilw", "refresh_token": "eyJzdWIiOiJtYWluLXBhdGllbnQtdGVzdC1lMmUtMDA3IiwiZW1haWwiOiJlMmUucGF0aWVudC4wMDdAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRW1tYSIsImxhc3RfbmFtZSI6IlBhdGllbnQifQ"}	2026-03-28 20:56:03.585
9f56bc229a8a663757bebbe0422fabf7ac6549094db7465c9d96a8e6804a0e4f	{"user": {"id": "702ac9d4-c215-4982-acc8-a90b33837249", "role": "patient", "email": "testuser_1774160628782@example.com", "doctorId": null, "lastName": "User", "firstName": "Test", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:24:38.031
c7d4e9bb31f5db76198304c435b6f39ea801fa69e7f91de21d986d94eb7c2b7e	{"user": {"id": "6464d0ea-9ef0-4143-9d7b-145fb32d51ea", "role": "patient", "email": "verifytest@example.com", "doctorId": null, "lastName": "Test", "firstName": "Verify", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:25:36.562
cdf7ebb8d4d6d82aad658c0aba3df1f0c3f4406d6cdc4c2f1d4459da906417ea	{"user": {"id": "6464d0ea-9ef0-4143-9d7b-145fb32d51ea", "role": "patient", "email": "verifytest@example.com", "doctorId": null, "lastName": "Test", "firstName": "Verify", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:25:47.064
e579aa4d4861c0de8ea7d7fb97e9133f7146fcb2df0407d7a335d03901a2fa59	{"user": {"id": "e5256832-f2ca-408b-9c2e-56ce17b24bc6", "role": "patient", "email": "test@example.com", "doctorId": null, "lastName": "User", "firstName": "Test", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:27:53.257
36e97898a373bab00813c03ef6574655224f411eaeb399dbd275ea97e65043e7	{"user": {"id": "e5256832-f2ca-408b-9c2e-56ce17b24bc6", "role": "patient", "email": "test@example.com", "doctorId": null, "lastName": "User", "firstName": "Test", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:27:58.28
24fbd901b5fd8b6ca78d5f1a91f553283de6443614cc4e38c336d2473c393f59	{"user": {"id": "e5256832-f2ca-408b-9c2e-56ce17b24bc6", "role": "patient", "email": "test@example.com", "doctorId": null, "lastName": "User", "firstName": "Test", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:27:58.409
10f09bbd40e4c2f68bd412352dfd500942cc2768159d85900b798c6c365c9ab0	{"user": {"id": "e5256832-f2ca-408b-9c2e-56ce17b24bc6", "role": "patient", "email": "test@example.com", "doctorId": null, "lastName": "User", "firstName": "Test", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:32:59.093
3fcbfb2394801b765052f525c35b734233047c827a951b69082a145a501b8581	{"user": {"id": "2dd9aa4e-35af-410d-a7c8-ec21720e50f5", "role": "patient", "email": "newuser@test.com", "doctorId": null, "lastName": "User", "firstName": "New", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:45:32.717
97fa805ceb1b03777c099bad62a39984725f52e5c56bfa0bdc7c38f01fd3c4d5	{"user": {"id": "3e745c25-f87f-49c8-82dd-424fbc9bb899", "role": "patient", "email": "otptest1774161971508@test.com", "doctorId": null, "lastName": "User", "firstName": "OTPTest", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:46:56.356
650504f5aaa971719e10d01a4c3b9162ea3709b6c7c4df18746c801cb30c82b6	{"user": {"id": "2a4d365d-6eb6-4461-9e59-da57035b399c", "role": "patient", "email": null, "doctorId": null, "lastName": "d", "firstName": "n", "hospitalId": null, "profileImageUrl": null}, "access_token": "local"}	2026-03-29 06:52:36.985
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, replit_user_id, role, hospital_id, doctor_id, phone, password_hash, reset_token, reset_token_expires, email_verified, phone_verified) FROM stdin;
ljaSKj	ljaSKj@example.com	John	Doe	\N	2026-03-21 20:12:27.543677+00	2026-03-21 20:12:27.543677+00	ljaSKj	patient	\N	\N	\N	\N	\N	\N	f	f
test-patient-001	patient001@test.com	Alice	Smith	\N	2026-03-21 20:13:16.087573+00	2026-03-21 20:13:16.087573+00	test-patient-001	patient	\N	\N	\N	\N	\N	\N	f	f
test-patient-002	patient002@test.com	Bob	Jones	\N	2026-03-21 20:14:35.155102+00	2026-03-21 20:14:35.155102+00	test-patient-002	patient	\N	\N	\N	\N	\N	\N	f	f
test-patient-003	patient003@test.com	Charlie	Brown	\N	2026-03-21 20:17:54.092776+00	2026-03-21 20:17:54.092776+00	test-patient-003	patient	\N	\N	\N	\N	\N	\N	f	f
test-patient-004	patient004@test.com	Diana	Prince	\N	2026-03-21 20:19:22.330453+00	2026-03-21 20:19:22.330453+00	test-patient-004	patient	\N	\N	\N	\N	\N	\N	f	f
test-auth-review-005	patient005@test.com	Eve	Adams	\N	2026-03-21 20:32:42.273182+00	2026-03-21 20:32:42.273182+00	test-auth-review-005	patient	\N	\N	\N	\N	\N	\N	f	f
test-patient-final-001	finaltest001@test.com	Final	Test	\N	2026-03-21 20:41:39.105612+00	2026-03-21 20:41:39.105612+00	test-patient-final-001	patient	\N	\N	\N	\N	\N	\N	f	f
seed-patient-1	alice.thompson@example.com	Alice	Thompson	\N	2026-03-21 20:50:50.358189+00	2026-03-21 20:50:50.358189+00	\N	patient	\N	\N	\N	\N	\N	\N	f	f
seed-patient-2	bob.williams@example.com	Bob	Williams	\N	2026-03-21 20:50:50.360841+00	2026-03-21 20:50:50.360841+00	\N	patient	\N	\N	\N	\N	\N	\N	f	f
seed-patient-3	carol.davis@example.com	Carol	Davis	\N	2026-03-21 20:50:50.363416+00	2026-03-21 20:50:50.363416+00	\N	patient	\N	\N	\N	\N	\N	\N	f	f
e2e-patient-main-001	e2e.patient@test.com	Emma	Patient	\N	2026-03-21 20:53:39.955863+00	2026-03-21 20:53:39.955863+00	e2e-patient-main-001	patient	\N	\N	\N	\N	\N	\N	f	f
main-patient-test-e2e-007	e2e.patient.007@test.com	Emma	Patient	\N	2026-03-21 20:56:03.580581+00	2026-03-21 20:56:03.580581+00	main-patient-test-e2e-007	patient	\N	\N	\N	\N	\N	\N	f	f
seed-super-admin	superadmin@medibook.demo	Super	Admin	\N	2026-03-21 21:25:35.580351+00	2026-03-21 21:25:35.580351+00	seed-super-admin	super_admin	\N	\N	\N	\N	\N	\N	f	f
seed-hospital-admin-1	admin@citymedical.demo	Hospital	Manager	\N	2026-03-21 21:25:35.583332+00	2026-03-21 21:25:35.583332+00	seed-hospital-admin-1	hospital_admin	13	\N	\N	\N	\N	\N	f	f
seed-doctor-1	james.wilson@medibook.demo	James	Wilson	\N	2026-03-21 21:25:35.588519+00	2026-03-21 21:25:35.595+00	seed-doctor-1	doctor	13	37	\N	\N	\N	\N	f	f
seed-doctor-2	emily.chen@medibook.demo	Emily	Chen	\N	2026-03-21 21:25:35.614968+00	2026-03-21 21:25:35.62+00	seed-doctor-2	doctor	14	38	\N	\N	\N	\N	f	f
seed-doctor-3	robert.patel@medibook.demo	Robert	Patel	\N	2026-03-21 21:25:35.637738+00	2026-03-21 21:25:35.643+00	seed-doctor-3	doctor	13	39	\N	\N	\N	\N	f	f
seed-doctor-4	sarah.johnson@medibook.demo	Sarah	Johnson	\N	2026-03-21 21:25:35.660022+00	2026-03-21 21:25:35.665+00	seed-doctor-4	doctor	15	40	\N	\N	\N	\N	f	f
seed-doctor-5	michael.davis@medibook.demo	Michael	Davis	\N	2026-03-21 21:25:35.682425+00	2026-03-21 21:25:35.69+00	seed-doctor-5	doctor	14	41	\N	\N	\N	\N	f	f
seed-doctor-6	priya.sharma@medibook.demo	Priya	Sharma	\N	2026-03-21 21:25:35.705629+00	2026-03-21 21:25:35.71+00	seed-doctor-6	doctor	13	42	\N	\N	\N	\N	f	f
seed-doctor-7	thomas.anderson@medibook.demo	Thomas	Anderson	\N	2026-03-21 21:25:35.726665+00	2026-03-21 21:25:35.732+00	seed-doctor-7	doctor	15	43	\N	\N	\N	\N	f	f
seed-doctor-8	aisha.khan@medibook.demo	Aisha	Khan	\N	2026-03-21 21:25:35.747902+00	2026-03-21 21:25:35.752+00	seed-doctor-8	doctor	14	44	\N	\N	\N	\N	f	f
seed-doctor-9	david.lee@medibook.demo	David	Lee	\N	2026-03-21 21:25:35.768182+00	2026-03-21 21:25:35.774+00	seed-doctor-9	doctor	13	45	\N	\N	\N	\N	f	f
seed-doctor-10	maria.garcia@medibook.demo	Maria	Garcia	\N	2026-03-21 21:25:35.789492+00	2026-03-21 21:25:35.795+00	seed-doctor-10	doctor	15	46	\N	\N	\N	\N	f	f
seed-doctor-11	kevin.brown@medibook.demo	Kevin	Brown	\N	2026-03-21 21:25:35.811468+00	2026-03-21 21:25:35.816+00	seed-doctor-11	doctor	14	47	\N	\N	\N	\N	f	f
seed-doctor-12	lisa.martinez@medibook.demo	Lisa	Martinez	\N	2026-03-21 21:25:35.831951+00	2026-03-21 21:25:35.837+00	seed-doctor-12	doctor	13	48	\N	\N	\N	\N	f	f
17719971	prasaddhanade33@gmail.com	Prasad	Dhanade	\N	2026-03-21 20:48:59.38213+00	2026-03-22 05:55:43.388+00	17719971	patient	\N	\N	\N	\N	\N	\N	f	f
702ac9d4-c215-4982-acc8-a90b33837249	testuser_1774160628782@example.com	Test	User	\N	2026-03-22 06:24:38.001577+00	2026-03-22 06:24:38.001577+00	\N	patient	\N	\N	\N	$2b$10$YUMkkYJRUnGDATkcbXwyt.TBsEcBYfw0RW/uwHlpfIeqeTKJ8cLc2	\N	\N	f	f
6464d0ea-9ef0-4143-9d7b-145fb32d51ea	verifytest@example.com	Verify	Test	\N	2026-03-22 06:25:36.558552+00	2026-03-22 06:25:36.558552+00	\N	patient	\N	\N	\N	$2b$10$g1V68uoZnbn9nok2Qgf8AuqB6xAoSrilVRCYuYGvj0IkF826l2qAG	\N	\N	f	f
e5256832-f2ca-408b-9c2e-56ce17b24bc6	test@example.com	Test	User	\N	2026-03-22 06:27:53.225892+00	2026-03-22 06:47:31.119+00	\N	patient	\N	\N	+919876543210	$2b$10$U4aFw35FpVxeDoJDuojrie78XMSdtONrxf9kyffIx2kMPXqCyFU0y	\N	\N	f	f
2a4d365d-6eb6-4461-9e59-da57035b399c	\N	n	d	\N	2026-03-22 06:52:36.959724+00	2026-03-22 06:52:36.959724+00	\N	patient	\N	\N	9767680152	$2b$10$1QgI/FnFVuu7/6VXMIZUzeQ6p5XWjZWSBbLMwQKUaiZqk3hUi4OkS	\N	\N	f	t
f9d586c5-9755-400c-98e1-330906bb8acc	\N	abcdefg	abcdefg	\N	2026-03-22 06:37:50.084808+00	2026-03-22 06:44:33.919+00	\N	patient	\N	\N	7249861562	$2b$10$i.UFpMsetk3n1adm6mkJk.9Ms9NxVmR7w85XT6D5KNBxjFvrmfzZS	69B1B4	2026-03-22 07:14:33.919+00	f	f
2dd9aa4e-35af-410d-a7c8-ec21720e50f5	newuser@test.com	New	User	\N	2026-03-22 06:45:32.713742+00	2026-03-22 06:45:32.713742+00	\N	patient	\N	\N	\N	$2b$10$hjY7bMHOuaedcsVfNNbdb.WMBFB/SJxho3XW5h6tuk4H8g4lk6dpa	\N	\N	t	f
3e745c25-f87f-49c8-82dd-424fbc9bb899	otptest1774161971508@test.com	OTPTest	User	\N	2026-03-22 06:46:56.325821+00	2026-03-22 06:46:56.325821+00	\N	patient	\N	\N	\N	$2b$10$HeWwkZoGv9flXNSeu9TJT.f.DiJYsJljAyrtOeR2lg7eTBzEGqwvm	\N	\N	t	f
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 16, true);


--
-- Name: availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.availability_id_seq', 240, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 50, true);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_id_seq', 48, true);


--
-- Name: hospitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_id_seq', 15, true);


--
-- Name: medical_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medical_records_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 6, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: availability availability_doctor_date_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_doctor_date_unique UNIQUE (doctor_id, date);


--
-- Name: availability availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_unique UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_one_per_appointment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_one_per_appointment UNIQUE (appointment_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_replit_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_replit_user_id_unique UNIQUE (replit_user_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: appointments_no_double_book_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX appointments_no_double_book_idx ON public.appointments USING btree (doctor_id, date, time_slot) WHERE (status = ANY (ARRAY['booked'::public.appointment_status, 'pending'::public.appointment_status]));


--
-- PostgreSQL database dump complete
--

\unrestrict faLAJfjqnMcjmaQaUCcWUrh6Gkm6Zq0MApVdE1TDJ3GN1AncUeJcIuO0mbRrh6l

