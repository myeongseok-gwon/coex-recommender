# 추천 시스템에서 사용자 입력 노력과 설명 제공이 만족도에 미치는 영향: Field Experiment 연구

## 연구 제목 (영문)
**The Impact of User Input Effort and Explanation Provision on Satisfaction in Recommender Systems: A Field Experiment Study**

부제: *Examining Effort Justification Effects and Rationale Display in LLM-based Recommendation Systems*

---

## 1. 연구 배경 및 필요성

### 1.1 Preference Elicitation의 딜레마
추천 시스템에서 사용자로부터 선호도 정보를 수집하는 과정(preference elicitation)은 추천 품질을 결정하는 핵심 요소이다. 그러나 사용자 정보 입력량과 관련하여 다음과 같은 상충관계(trade-off)가 존재한다:

- **과도한 정보 요구**: 사용자 이탈(user churn) 증가 우려
- **충분한 정보 수집**: 추천 정확도 향상 및 심리적 몰입 유도

### 1.2 Effort Justification 효과
심리학의 노력 정당화(effort justification) 이론에 따르면, 사용자가 더 많은 노력을 투입했을 때 그 결과물에 대한 가치를 더 높게 평가하는 경향이 있다. 이는 추천 시스템에서 다음과 같은 가설을 제기한다:

> 사용자가 더 많은 입력 노력을 기울일 경우, 실제 추천 품질과 무관하게 추천 결과에 대한 만족도가 증가할 수 있다.

### 1.3 Explainable Recommender Systems
설명 가능한 추천 시스템(explainable recommender systems)은 추천 이유를 제공함으로써 사용자의 신뢰와 만족도를 높이는 것으로 알려져 있다. 특히 LLM 기반 추천 시스템은 개인화된 자연어 설명(rationale)을 생성하는 데 강점을 가진다.

---

## 2. 연구 목적 및 연구 질문

### 2.1 연구 목적
본 연구는 대규모 박람회 환경에서 실시간 부스 추천 시나리오를 활용하여, (1) 사용자 입력 노력이 추천 만족도에 미치는 영향과 (2) 추천 설명 방식이 만족도에 미치는 영향을 실증적으로 검증하고자 한다.

### 2.2 핵심 연구 질문
1. **RQ1**: 사용자 입력 노력의 증가가 추천 시스템 만족도를 향상시키는가? (Effort Justification 효과)
2. **RQ2**: 추가 입력 정보(free text)의 활용이 실제 추천 품질을 개선하는가?
3. **RQ3**: LLM이 생성한 추천 이유(rationale) 제공이 단순 정보 제공 대비 만족도를 높이는가?
4. **RQ4**: 입력 노력과 설명 방식 간 상호작용 효과(시너지)가 존재하는가?

---

## 3. 연구 방법

### 3.1 연구 디자인
**3 × 2 Factorial Between-Subjects Field Experiment**

### 3.2 실험 환경
- **장소**: 한국 최대 규모 박람회 (예: COEX)
- **대상**: 박람회 참관객 약 120명
- **시스템**: LLM 기반 실시간 부스 추천 시스템

### 3.3 독립변수

#### Factor 1: 사용자 입력 방식 (3 levels)

| 조건 | 설명 | 입력 방법 | 추천 생성에 사용되는 데이터 |
|------|------|-----------|---------------------------|
| **C1: 기본 입력** | Button-Based Guided Input만 제공 | 버튼 선택만 | 버튼 데이터만 |
| **C2: 노력 증가 (통제)** | Button + Free Text 입력 요구 | 버튼 + 자유 텍스트 | 버튼 데이터만 (텍스트 미사용) |
| **C3: 노력 증가 (활용)** | Button + Free Text 입력 요구 | 버튼 + 자유 텍스트 | 버튼 + 텍스트 모두 사용 |

**실험 논리**:
- **C1 vs C2**: 입력 노력은 다르지만 추천 품질은 동일 → Effort Justification 효과 순수 측정
- **C2 vs C3**: 입력 노력은 동일하지만 추천 품질은 다름 → 추가 입력의 실제 효용 측정

#### Factor 2: 추천 결과 표시 방식 (2 levels)

| 조건 | 설명 |
|------|------|
| **D1: Rationale 표시** | LLM이 생성한 개인화된 추천 이유 제공 |
| **D2: 정보 표시** | 부스의 객관적 정보(카테고리, 제품 등) 제공 |

### 3.4 종속변수
1. **주관적 만족도**
   - 추천 시스템 전반 만족도
   - 추천 결과 만족도
   - 재사용 의향
   
2. **객관적 성능 지표**
   - 추천 부스 방문률
   - 추천 부스 체류 시간
   - 실제 구매/계약 전환율

3. **추가 측정 변수**
   - 지각된 추천 정확도
   - 시스템 신뢰도
   - 입력 과정의 지각된 노력
   - 추천 이유의 유용성 (D1 조건에서)

### 3.5 실험 절차
1. **참가자 모집**: 박람회 입구에서 무작위 모집
2. **무작위 배정**: 6개 조건 중 하나로 무작위 배정
3. **사용자 정보 입력**: 할당된 조건에 따른 입력 방식
4. **추천 제공**: LLM 기반 부스 추천 (3-5개)
5. **추천 결과 표시**: 할당된 조건에 따른 표시 방식
6. **부스 방문**: 참가자의 자유로운 부스 탐색
7. **사후 설문**: 만족도 및 추가 변수 측정
8. **행동 추적**: 앱을 통한 방문 부스 및 체류 시간 기록

---

## 4. 기대 효과 및 가설

### 4.1 연구 가설

**H1** (Effort Justification): C2 조건의 참가자는 C1 조건 대비 높은 만족도를 보일 것이다.

**H2** (Actual Performance): C3 조건의 참가자는 C2 조건 대비 높은 만족도와 객관적 성과를 보일 것이다.

**H3** (Rationale Effect): D1 조건의 참가자는 D2 조건 대비 높은 만족도와 신뢰도를 보일 것이다.

**H4** (Interaction Effect): Rationale 제공(D1)은 높은 입력 노력 조건(C2, C3)에서 만족도 증가 효과가 더 클 것이다.

### 4.2 기대 효과

#### 이론적 기여
1. **Effort Justification 이론의 추천 시스템 적용**: 심리학 이론을 HCI/RecSys 맥락으로 확장
2. **입력-성능 관계 실증**: 추가 입력의 실제 효용과 지각된 가치 분리 측정
3. **설명 가능성과 노력의 상호작용**: 두 요인 간 시너지 효과 규명

#### 실무적 기여
1. **Preference Elicitation 전략 제시**: 최적의 사용자 입력 수준 가이드라인
2. **LLM 기반 추천 시스템 설계 원칙**: Rationale 생성 및 활용 방안
3. **Field Experiment 방법론**: 실제 환경에서의 추천 시스템 평가 프레임워크

---

## 5. 연구의 독창성 및 차별성

### 5.1 방법론적 독창성
- **Real-World Field Experiment**: 실험실이 아닌 실제 박람회 환경에서 진행
- **High-Stakes Context**: 실제 의사결정(부스 방문, 구매)이 발생하는 맥락
- **Behavioral Data Integration**: 설문 데이터와 실제 행동 데이터의 결합

### 5.2 이론적 독창성
- **Effort Justification의 RecSys 적용**: 기존 연구가 부족한 영역
- **입력 노력과 실제 성능의 분리**: 인과관계 명확화를 위한 정교한 실험 설계
- **LLM as RecSys**: 최신 기술 트렌드를 반영한 연구

---

## 6. 연구 일정 및 계획

| 단계 | 기간 | 주요 활동 |
|------|------|-----------|
| 사전 준비 | 1-2개월 | 시스템 개발 완료, IRB 승인, 파일럿 테스트 |
| 데이터 수집 | 박람회 기간 (3-5일) | 120명 참가자 모집 및 실험 진행 |
| 데이터 분석 | 1개월 | 통계 분석 및 결과 해석 |
| 논문 작성 | 2-3개월 | 학술 논문 작성 및 투고 |

---

## 7. 예상 연구 성과

### 7.1 학술적 성과
- **Target Journals**: 
  - ACM TOCHI (Transactions on Computer-Human Interaction)
  - MIS Quarterly
  - Journal of Management Information Systems
  - RecSys (Conference)

### 7.2 실무적 성과
- 추천 시스템 설계 가이드라인 개발
- LLM 기반 추천 시스템 베스트 프랙티스 정립
- 박람회 및 이벤트 산업에서의 추천 시스템 활용 방안 제시

---

## 8. 참고문헌 (예시)

1. Aronson, E., & Mills, J. (1959). The effect of severity of initiation on liking for a group. *Journal of Abnormal and Social Psychology*.

2. Tintarev, N., & Masthoff, J. (2015). Explaining recommendations: Design and evaluation. *Recommender Systems Handbook*.

3. Zhao, Q., et al. (2024). Large language models for recommendation: A survey and new perspectives. *ACM Computing Surveys*.

4. Pu, P., Chen, L., & Hu, R. (2011). A user-centric evaluation framework for recommender systems. *RecSys*.

5. McNee, S. M., et al. (2006). Being accurate is not enough: How accuracy metrics have hurt recommender systems. *CHI Extended Abstracts*.

---

## 부록: 실험 조건 매트릭스

| Group | Input Condition | Display Condition | N |
|-------|----------------|-------------------|---|
| 1 | C1 (Button Only) | D1 (Rationale) | 20 |
| 2 | C1 (Button Only) | D2 (Info) | 20 |
| 3 | C2 (Button+Text, Button Used) | D1 (Rationale) | 20 |
| 4 | C2 (Button+Text, Button Used) | D2 (Info) | 20 |
| 5 | C3 (Button+Text, Both Used) | D1 (Rationale) | 20 |
| 6 | C3 (Button+Text, Both Used) | D2 (Info) | 20 |
| **Total** | | | **120** |

---

**연구책임자**: [이름]  
**소속기관**: [소속]  
**연락처**: [이메일]  
**작성일**: 2025년 10월 15일

