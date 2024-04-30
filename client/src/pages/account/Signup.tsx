import { RoleProps, SignupData } from "../../types/interface";
import "../../styles/pages/account/signup.scss";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FormProvider, set, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import usePrevious from "../../hooks/usePrevious";
import SignupForm from "../../components/form/SignupForm";

export default function StudentSignup({ role }: RoleProps) {
    const navigate = useNavigate();
    const methods = useForm<SignupData>({
        mode: "onSubmit",
        defaultValues: {
            id: "",
            password: "",
            nickname: "",
            email: "",
            authDocument: null,
            certification: undefined,
        },
    });

    const { watch, reset } = methods;

    const [isIdChecked, setIsIdChecked] = useState(false);
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isCertified, setIsCertified] = useState(false);
    const [randomNum, setRandomNum] = useState(0);

    const navigateAndReset = (path: string) => {
        reset();
        navigate(path);
        setIsIdChecked(false);
        setIsNicknameChecked(false);
        setIsCertified(false);
    };

    const idValue = watch("id");
    const nicknameValue = watch("nickname");
    const emailValue = watch("email");
    const preIdValue = usePrevious(idValue);
    const preNicknameValue = usePrevious(nicknameValue);
    const preEmailValue = usePrevious(emailValue);

    useEffect(() => {
        if (idValue !== preIdValue) setIsIdChecked(false);
        if (nicknameValue !== preNicknameValue) setIsNicknameChecked(false);
        if (emailValue !== preEmailValue) setIsCertified(false);
    }, [idValue, nicknameValue, emailValue, preIdValue, preNicknameValue, preEmailValue]);

    /* axios */
    // 중복 체크(아이디, 닉네임)
    const checkDuplicate = async (keyword: string, value: string): Promise<void> => {
        if (!value) return alert(`${keyword === "id" ? "아이디를" : "닉네임을"} 입력해주세요.`);

        try {
            const url = `${process.env.REACT_APP_API_SERVER}/api/check${
                role === "student" ? "Student" : "Tutor"
            }${keyword === "id" ? "Id" : "Nickname"}?${keyword}=${value}`;

            const res = await axios.get(url);

            if (res.data.available === false) {
                alert(`이미 사용중인 ${keyword === "id" ? "아이디" : "닉네임"}입니다.`);
            } else {
                alert(`사용 가능한 ${keyword === "id" ? "아이디" : "닉네임"}입니다.`);
                keyword === "id" ? setIsIdChecked(true) : setIsNicknameChecked(true);
            }
        } catch (error) {
            console.error("아이디 중복검사 오류", error);
        }
    };

    // 회원가입
    const signup = async (role: string, data: SignupData | FormData) => {
        if (!isIdChecked || !isNicknameChecked)
            return alert("아이디와 닉네임 모두 중복 확인을 해주세요.");

        if (!isCertified) return alert("이메일 인증을 해주세요.");

        if (data instanceof FormData) {
            const newFormData = new FormData();
            data.forEach((value, key) => {
                const newKey = key === "authDocument" ? "auth" : key;
                newFormData.append(newKey, value);
            });

            const nickname = newFormData.get("nickname") as string;

            try {
                const res = await axios({
                    method: "post",
                    url: `${process.env.REACT_APP_API_SERVER}/api/${role}`,
                    data: newFormData,
                    headers: { "Content-Type": "multipart/form-data" },
                });

                alert(`${res.data}! ${nickname}님 환영합니다🎉\n로그인 페이지로 이동합니다.`);
                navigate("/login");
            } catch (error) {
                console.error("회원가입 오류", error);
            }
        } else {
            try {
                const res = await axios.post(
                    `${process.env.REACT_APP_API_SERVER}/api/${role}`,
                    data
                );

                alert(`${res.data}! ${data.nickname}님 환영합니다🎉\n로그인 페이지로 이동합니다.`);
                navigate("/login");
            } catch (error) {
                console.error("회원가입 오류", error);
            }
        }
    };

    // 이메일 인증
    const sendEmail = async (email: string) => {
        const res = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/email`, {
            email,
        });

        if (res.data.randomNum) setRandomNum(res.data.randomNum);
        else alert(res.data);
    };

    // 인증번호 확인
    const checkCertification = (certification: number) => {
        if (!certification) return alert("인증번호를 입력해주세요.");

        if (certification === randomNum) {
            alert("인증되었습니다.");
            setIsCertified(true);
        } else {
            alert("인증번호가 일치하지 않습니다.");
        }
    };

    return (
        <section>
            <div className="signup_container">
                <h2>{role === "student" ? "학생 " : "강사 "} 회원가입</h2>
                <div className="go_to_other_sign_up">
                    {role === "student" ? (
                        <button type="button" onClick={() => navigateAndReset("/signup/tutor")}>
                            강사로 가입하기
                        </button>
                    ) : (
                        <button type="button" onClick={() => navigateAndReset("/signup/student")}>
                            학생으로 가입하기
                        </button>
                    )}
                </div>
                <span>이미 계정이 있으신가요?</span>
                &nbsp;
                <Link to="/login">로그인</Link>
                <FormProvider {...methods}>
                    <SignupForm
                        role={role}
                        signup={signup}
                        checkDuplicate={checkDuplicate}
                        sendEmail={sendEmail}
                        checkCertification={checkCertification}
                    />
                </FormProvider>
            </div>
        </section>
    );
}
