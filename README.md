# Nutora

**Nutora** — **AI Calorie Tracker from Photos** — to aplikacja mobilna na **iOS i Androida**, która pozwala użytkownikowi oszacować kalorie i makroskładniki posiłku na podstawie zdjęcia.

Użytkownik robi zdjęcie jedzenia lub wybiera zdjęcie z galerii, a aplikacja analizuje posiłek przy użyciu AI i zwraca szacunkową liczbę kalorii, białka, tłuszczów oraz węglowodanów.

Główna idea aplikacji:

> Zrób zdjęcie posiłku i w kilka sekund otrzymaj szacunkową analizę kalorii oraz makroskładników.

---

## Dane produktu

* App Name: Nutora
* Android Package Name: `io.nutora.app`
* iOS Bundle Identifier: `io.nutora.app`
* URL Scheme: `nutora`
* Website: `https://nutora.pro`
* API: `https://api.nutora.pro`
* Admin Panel: `https://api.nutora.pro/admin`
* Support / Contact: `contact@nutora.pro`
* Privacy Policy: `https://nutora.pro/privacy`
* Terms of Service: `https://nutora.pro/terms`

---

## Cel projektu

Celem projektu jest stworzenie prostej, nowoczesnej i wygodnej aplikacji mobilnej do codziennego liczenia kalorii.

Aplikacja ma rozwiązywać problem ręcznego wpisywania produktów, ważenia składników i przeszukiwania baz jedzenia. Użytkownik może po prostu zrobić zdjęcie posiłku, otrzymać wynik i ewentualnie poprawić porcję.

Aplikacja nie ma udawać idealnej dokładności. Wyniki mają być prezentowane jako **szacunek**, a użytkownik powinien mieć możliwość ich edycji.

---

## Platformy

Aplikacja ma być dostępna na:

* iOS,
* Android.

Projekt powinien być tworzony jako aplikacja cross-platformowa, aby jedna baza kodu obsługiwała obie platformy.

Rekomendowany stack:

* React Native,
* Expo,
* TypeScript.

---

## Model biznesowy

Aplikacja działa w modelu freemium.

### Plan darmowy

Użytkownik może:

* założyć konto,
* ustawić cel kaloryczny,
* wykonać ograniczoną liczbę analiz zdjęć miesięcznie,
* zapisywać podstawową historię posiłków.

Przykładowy limit:

```text
5 analiz zdjęć miesięcznie
```

### Plan Premium

Cena robocza:

```text
30 zł / miesiąc
```

Plan Premium daje użytkownikowi:

* większy limit analiz zdjęć,
* historię posiłków,
* statystyki tygodniowe i miesięczne,
* analizę makroskładników,
* edycję porcji,
* cele kalorii i makro,
* raporty postępów,
* brak reklam.

Przykładowy limit Premium:

```text
300 analiz zdjęć miesięcznie
```

W przyszłości można dodać także plan roczny, np.:

```text
199–249 zł / rok
```

---

## Główne funkcje aplikacji

### 1. Onboarding

Ekran powitalny, który wyjaśnia użytkownikowi, do czego służy aplikacja.

Przykładowe teksty:

```text
Policz kalorie ze zdjęcia
```

```text
Zrób zdjęcie swojego posiłku, a my oszacujemy kalorie oraz makroskładniki w kilka sekund.
```

Przyciski:

```text
Zacznij
Mam już konto
```

---

### 2. Rejestracja i logowanie

Aplikacja powinna umożliwiać:

* rejestrację przez e-mail i hasło,
* logowanie przez e-mail i hasło,
* logowanie przez Google,
* logowanie przez Apple.

Logowanie przez Apple jest szczególnie ważne przed publikacją aplikacji na iOS.

---

### 3. Konfiguracja profilu użytkownika

Po pierwszym logowaniu użytkownik powinien ustawić podstawowe dane:

* imię,
* płeć,
* wiek,
* wzrost,
* waga,
* cel,
* poziom aktywności,
* dzienny cel kalorii.

Cele użytkownika:

```text
Redukcja
Utrzymanie wagi
Budowanie masy
```

Poziom aktywności:

```text
Niski
Średni
Wysoki
```

Aplikacja może zaproponować dzienny cel kalorii, ale użytkownik powinien móc go edytować ręcznie.

---

### 4. Ekran główny

Ekran główny pokazuje dzisiejszy postęp użytkownika.

Elementy:

* przywitanie użytkownika,
* dzienny cel kalorii,
* liczba zjedzonych kalorii,
* procent realizacji celu,
* postęp w formie koła lub paska,
* szybki przycisk zrobienia zdjęcia posiłku,
* karty makroskładników,
* ostatnie posiłki.

Przykładowe teksty:

```text
Cześć, Rafał
```

```text
Dzisiejszy cel
2200 kcal
```

```text
Zjedzone
1460 kcal
```

```text
Zrób zdjęcie posiłku
```

Sekcja makro:

```text
Białko
Tłuszcze
Węglowodany
```

Sekcja ostatnich posiłków:

```text
Ostatnie posiłki
```

Przykładowe wpisy:

```text
Śniadanie — Owsianka z owocami — 412 kcal
Obiad — Kurczak z ryżem i warzywami — 684 kcal
Kolacja — Sałatka z tuńczykiem — 364 kcal
```

---

### 5. Aparat i dodawanie zdjęcia

Użytkownik powinien móc:

* zrobić zdjęcie posiłku aparatem,
* wybrać zdjęcie z galerii.

Po dodaniu zdjęcia aplikacja pokazuje ekran ładowania.

Przykładowe komunikaty:

```text
Analizujemy Twój posiłek...
```

```text
Rozpoznajemy składniki...
```

```text
Szacujemy kalorie i makroskładniki...
```

W przypadku błędu:

```text
Nie udało się przeanalizować zdjęcia. Spróbuj ponownie lub dodaj posiłek ręcznie.
```

---

### 6. Analiza zdjęcia przez AI

Analiza zdjęcia powinna działać po stronie backendu.

Aplikacja mobilna nie może wysyłać zapytań bezpośrednio do API AI z kluczem zapisanym w aplikacji.

Proces:

1. Użytkownik robi zdjęcie lub wybiera zdjęcie z galerii.
2. Zdjęcie trafia do storage.
3. Backend wysyła zdjęcie do modelu AI.
4. Model AI analizuje posiłek.
5. Backend zapisuje wynik w bazie danych.
6. Aplikacja wyświetla wynik użytkownikowi.

---

### 7. Ekran wyniku analizy

Ekran pokazuje:

* zdjęcie posiłku,
* szacowaną liczbę kalorii,
* wykryte składniki,
* kalorie dla składników,
* makroskładniki,
* poziom pewności analizy,
* informację, że wynik jest szacunkowy,
* przycisk zapisu posiłku,
* przycisk poprawy porcji.

Przykład:

```text
684 kcal
Szacowana wartość
```

Sekcja składników:

```text
Wykryte składniki
```

Przykładowe składniki:

```text
Kurczak grillowany — 240 kcal
Ryż biały — 272 kcal
Warzywa — 120 kcal
Sos śmietanowy — 52 kcal
```

Makroskładniki:

```text
Białko: 45 g
Tłuszcze: 18 g
Węglowodany: 74 g
```

Komunikat:

```text
To tylko szacunek. Rzeczywiste wartości mogą się różnić.
```

Przyciski:

```text
Zapisz posiłek
Popraw porcję
```

---

### 8. Poprawa porcji

Użytkownik powinien móc poprawić wynik AI.

Możliwe akcje:

* zmiana ilości składnika,
* usunięcie składnika,
* dodanie składnika,
* zmiana kalorii ręcznie,
* oznaczenie porcji jako mała, średnia lub duża.

Przykład:

```text
Ryż biały
AI oszacowało: 150 g
Zmień na: 200 g
```

Po zmianie porcji aplikacja powinna przeliczyć kalorie i makroskładniki.

---

### 9. Historia posiłków

Ekran historii pokazuje zapisane posiłki.

Widoki:

* dzisiaj,
* wczoraj,
* ostatni tydzień,
* ostatni miesiąc.

Każdy posiłek powinien zawierać:

* miniaturkę zdjęcia,
* nazwę posiłku,
* godzinę,
* kalorie,
* makroskładniki,
* możliwość edycji,
* możliwość usunięcia.

Przykład:

```text
Obiad
Kurczak z ryżem i warzywami
684 kcal
Dzisiaj, 13:15
```

---

### 10. Postępy i statystyki

Ekran postępów pokazuje dane użytkownika w czasie.

Elementy:

* wykres kalorii tygodniowy,
* wykres miesięczny,
* średnia dzienna,
* najlepszy dzień,
* seria dni z dodanymi posiłkami,
* liczba wykonanych analiz.

Zakładki:

```text
Tydzień
Miesiąc
Rok
```

Karty statystyk:

```text
Średnia dzienna
1793 kcal
```

```text
Najlepszy dzień
2310 kcal
```

```text
Seria
7 dni
```

---

### 11. Profil użytkownika

Profil powinien zawierać:

* imię,
* e-mail,
* aktualną wagę,
* cel kaloryczny,
* cel użytkownika,
* ustawienia konta,
* subskrypcję,
* regulamin,
* politykę prywatności,
* wylogowanie.

Sekcje:

```text
Moje cele
Subskrypcja
Ustawienia
Pomoc
```

---

### 12. Subskrypcja Premium

Ekran Premium powinien jasno pokazywać korzyści z subskrypcji.

Nagłówek:

```text
Odblokuj pełną analizę posiłków
```

Opis:

```text
Zrób zdjęcie posiłku i otrzymaj szybki szacunek kalorii, makroskładników oraz historii swoich postępów.
```

Benefity:

```text
Większy limit analiz zdjęć
Historia posiłków
Statystyki tygodniowe i miesięczne
Cele kalorii i makro
Poprawianie porcji
Raporty postępów
```

Cena:

```text
30 zł / miesiąc
```

CTA:

```text
Rozpocznij Premium
```

---

## Nawigacja

Dolna nawigacja aplikacji:

```text
Start
Aparat
Historia
Profil
```

Proponowana struktura ekranów:

```text
/onboarding
/login
/register
/profile-setup
/home
/camera
/analysis/:id
/edit-meal/:id
/history
/progress
/profile
/subscription
/settings
```

---

## Proponowany stack technologiczny

### Mobile

```text
React Native
Expo
TypeScript
Expo Router
```

### Stan aplikacji

```text
Zustand
```

albo:

```text
React Context
```

Dla MVP preferowany jest Zustand.

### Backend

Preferowany backend dla MVP:

```text
Supabase
```

Supabase powinien obsługiwać:

* autoryzację,
* bazę danych PostgreSQL,
* storage zdjęć,
* edge functions lub backend endpointy.

### AI

Model AI powinien obsługiwać analizę obrazu.

Ważne:

* klucz API AI musi być przechowywany po stronie backendu,
* aplikacja mobilna nie może zawierać klucza API,
* odpowiedź AI powinna być walidowana po stronie backendu,
* wynik powinien być zapisany w bazie danych.

### Subskrypcje

Do obsługi subskrypcji na iOS i Androidzie rekomendowane jest:

```text
RevenueCat
```

RevenueCat ułatwia obsługę:

* App Store,
* Google Play,
* planów miesięcznych,
* planów rocznych,
* statusu subskrypcji,
* triali,
* anulowania subskrypcji.

---

## Struktura projektu

Proponowana struktura katalogów:

```text
src/
  app/
    onboarding/
    auth/
    home/
    camera/
    analysis/
    history/
    progress/
    profile/
    subscription/
    settings/
  components/
    buttons/
    cards/
    charts/
    navigation/
    forms/
    layout/
  features/
    auth/
    meals/
    ai-analysis/
    subscription/
    profile/
    progress/
  services/
    supabase.ts
    ai.ts
    revenuecat.ts
    storage.ts
  store/
    authStore.ts
    mealsStore.ts
    userStore.ts
    subscriptionStore.ts
  hooks/
  utils/
  constants/
  types/
  assets/
```

---

## Struktura bazy danych

### users

```text
id UUID primary key
email text
name text
created_at timestamp
updated_at timestamp
```

---

### user_profiles

```text
id UUID primary key
user_id UUID foreign key
gender text
age integer
height_cm integer
weight_kg numeric
goal text
activity_level text
daily_calorie_goal integer
protein_goal_g integer
fat_goal_g integer
carbs_goal_g integer
created_at timestamp
updated_at timestamp
```

Pole `goal`:

```text
lose_weight
maintain
gain_weight
```

Pole `activity_level`:

```text
low
medium
high
```

---

### meals

```text
id UUID primary key
user_id UUID foreign key
photo_url text
meal_name text
meal_type text
estimated_calories integer
protein_g numeric
fat_g numeric
carbs_g numeric
confidence_score numeric
ai_notes text
created_at timestamp
updated_at timestamp
```

Pole `meal_type`:

```text
breakfast
lunch
dinner
snack
other
```

---

### meal_items

```text
id UUID primary key
meal_id UUID foreign key
name text
estimated_weight_g numeric
estimated_calories integer
protein_g numeric
fat_g numeric
carbs_g numeric
confidence_score numeric
created_at timestamp
updated_at timestamp
```

---

### ai_analysis_logs

```text
id UUID primary key
user_id UUID foreign key
meal_id UUID nullable
model_name text
input_tokens integer
output_tokens integer
estimated_cost_usd numeric
status text
error_message text nullable
created_at timestamp
```

---

### subscriptions

```text
id UUID primary key
user_id UUID foreign key
provider text
provider_customer_id text
provider_subscription_id text
status text
plan text
current_period_start timestamp
current_period_end timestamp
created_at timestamp
updated_at timestamp
```

Pole `provider`:

```text
revenuecat
apple
google
stripe
```

Pole `status`:

```text
active
trialing
cancelled
expired
past_due
```

---

## Typy TypeScript

```ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface Meal {
  id: string;
  userId: string;
  photoUrl?: string;
  mealName: string;
  mealType: MealType;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore?: number;
  aiNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  mealId: string;
  name: string;
  estimatedWeightG?: number;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIAnalysisResult {
  isFood: boolean;
  mealName: string;
  estimatedCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  confidenceScore: number;
  items: MealItem[];
  notes?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
  activityLevel: 'low' | 'medium' | 'high';
  dailyCalorieGoal: number;
  proteinGoalG?: number;
  fatGoalG?: number;
  carbsGoalG?: number;
}
```

---

## Prompt do analizy AI

Backend powinien wysyłać do AI prompt wymuszający odpowiedź w JSON.

```text
You are a nutrition estimation assistant. Analyze the provided meal image and estimate the food items, portion sizes, calories, protein, fat, and carbohydrates.

Important:
- Return only valid JSON.
- Values must be estimates.
- If you are uncertain, use a lower confidence score.
- Do not provide medical advice.
- Do not claim exact accuracy.
- If the image does not contain food, return an error field.

Return JSON in this structure:

{
  "is_food": true,
  "meal_name": "string",
  "estimated_calories": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  "confidence_score": number,
  "items": [
    {
      "name": "string",
      "estimated_weight_g": number,
      "estimated_calories": number,
      "protein_g": number,
      "fat_g": number,
      "carbs_g": number,
      "confidence_score": number
    }
  ],
  "notes": "string"
}
```

Przykładowa odpowiedź:

```json
{
  "is_food": true,
  "meal_name": "Kurczak z ryżem i warzywami",
  "estimated_calories": 684,
  "protein_g": 45,
  "fat_g": 18,
  "carbs_g": 74,
  "confidence_score": 0.72,
  "items": [
    {
      "name": "Kurczak grillowany",
      "estimated_weight_g": 150,
      "estimated_calories": 240,
      "protein_g": 36,
      "fat_g": 8,
      "carbs_g": 0,
      "confidence_score": 0.78
    },
    {
      "name": "Ryż biały",
      "estimated_weight_g": 180,
      "estimated_calories": 272,
      "protein_g": 5,
      "fat_g": 1,
      "carbs_g": 60,
      "confidence_score": 0.7
    },
    {
      "name": "Warzywa",
      "estimated_weight_g": 150,
      "estimated_calories": 120,
      "protein_g": 3,
      "fat_g": 1,
      "carbs_g": 20,
      "confidence_score": 0.68
    },
    {
      "name": "Sos śmietanowy",
      "estimated_weight_g": 40,
      "estimated_calories": 52,
      "protein_g": 1,
      "fat_g": 8,
      "carbs_g": 2,
      "confidence_score": 0.55
    }
  ],
  "notes": "To szacunkowa analiza na podstawie zdjęcia. Rzeczywiste wartości mogą się różnić."
}
```

---

## Endpointy backendu

### POST /api/analyze-meal-photo

Endpoint analizuje zdjęcie posiłku.

Proces:

1. Sprawdza, czy użytkownik jest zalogowany.
2. Sprawdza limit analiz użytkownika.
3. Przyjmuje zdjęcie lub URL zdjęcia.
4. Wysyła zdjęcie do AI.
5. Waliduje odpowiedź.
6. Zapisuje posiłek w bazie.
7. Zwraca wynik do aplikacji.

Przykładowe body:

```json
{
  "imageUrl": "string",
  "mealType": "lunch"
}
```

Przykładowa odpowiedź:

```json
{
  "mealId": "uuid",
  "mealName": "Kurczak z ryżem i warzywami",
  "estimatedCalories": 684,
  "proteinG": 45,
  "fatG": 18,
  "carbsG": 74,
  "confidenceScore": 0.72,
  "items": [
    {
      "name": "Kurczak grillowany",
      "estimatedCalories": 240,
      "proteinG": 36,
      "fatG": 8,
      "carbsG": 0
    }
  ]
}
```

---

### GET /api/meals

Zwraca listę posiłków użytkownika.

Możliwe parametry:

```text
date
from
to
mealType
```

---

### GET /api/meals/:id

Zwraca szczegóły konkretnego posiłku.

---

### PATCH /api/meals/:id

Aktualizuje posiłek.

Możliwe zmiany:

* nazwa posiłku,
* kalorie,
* makroskładniki,
* składniki,
* typ posiłku.

---

### DELETE /api/meals/:id

Usuwa posiłek użytkownika.

---

## Limity użytkowników

Aplikacja powinna kontrolować liczbę analiz zdjęć.

### Darmowy użytkownik

```text
5 analiz miesięcznie
```

### Premium

```text
300 analiz miesięcznie
```

Po przekroczeniu limitu darmowy użytkownik powinien zobaczyć ekran Premium.

Komunikat:

```text
Wykorzystałeś darmowy limit analiz w tym miesiącu.
Przejdź na Premium, aby dalej analizować posiłki ze zdjęć.
```

---

## Bezpieczeństwo i ograniczenia

Aplikacja musi jasno informować, że:

* nie jest aplikacją medyczną,
* nie zastępuje dietetyka,
* wyniki są szacunkowe,
* analiza zdjęcia może być niedokładna,
* użytkownik może poprawić porcję ręcznie.

Komunikat:

```text
FotoKalorie nie jest aplikacją medyczną. Wyniki są szacunkowe i mogą różnić się od rzeczywistych wartości.
```

---

## Styl graficzny

Aplikacja powinna mieć nowoczesny wygląd typu health-tech.

Styl:

* jasne tło,
* dużo bieli,
* zielone akcenty,
* zaokrąglone karty,
* delikatne cienie,
* czytelna typografia,
* minimalistyczny wygląd,
* przyjazny, ale profesjonalny charakter.

Kolory robocze:

```text
Primary Green: #2E8B20
Light Green: #EAF7E5
Background: #FAFAF7
White: #FFFFFF
Dark Text: #111827
Muted Text: #6B7280
Border: #E5E7EB
Orange Accent: #F59E0B
Blue Accent: #2563EB
Error: #DC2626
Success: #16A34A
```

---

## Komponenty UI

W projekcie powinny powstać komponenty wielokrotnego użytku:

```text
PrimaryButton
SecondaryButton
CalorieProgressCard
MacroCard
MealListItem
BottomTabNavigation
PhotoAnalysisCard
SubscriptionCard
ProgressChart
ScreenHeader
LoadingState
ErrorState
EmptyState
```

---

## MVP — zakres pierwszej wersji

Pierwsza wersja aplikacji powinna zawierać:

1. Onboarding.
2. Rejestrację.
3. Logowanie.
4. Konfigurację profilu.
5. Dashboard.
6. Dodawanie zdjęcia z aparatu.
7. Dodawanie zdjęcia z galerii.
8. Mockowaną analizę zdjęcia.
9. Ekran wyniku analizy.
10. Zapis posiłku.
11. Historię posiłków.
12. Ekran postępów.
13. Profil użytkownika.
14. Ekran Premium.
15. Limit darmowych analiz.
16. Przygotowaną strukturę pod Supabase.
17. Przygotowaną strukturę pod RevenueCat.
18. Przygotowaną strukturę pod prawdziwe API AI.

---

## Funkcje poza MVP

Funkcje, które można dodać później:

* ręczne dodawanie posiłków,
* skanowanie kodów kreskowych,
* integracja z Apple Health,
* integracja z Google Fit,
* raport tygodniowy generowany przez AI,
* rekomendacje żywieniowe,
* cele wagi,
* wykres zmiany wagi,
* planowanie posiłków,
* przypomnienia push,
* widżety,
* tryb dla sportowców,
* wersja webowa,
* panel admina,
* program afiliacyjny,
* baza produktów,
* eksport danych.

---

## Etapy prac

### Etap 1 — UI na mockach

Zbudować aplikację z kompletnym UI i mockowanymi danymi.

Ekrany:

* Onboarding,
* Login,
* Register,
* Profile Setup,
* Home Dashboard,
* Camera,
* Analysis Result,
* Edit Portion,
* History,
* Progress,
* Profile,
* Subscription.

Na tym etapie aplikacja nie musi mieć prawdziwego backendu.

---

### Etap 2 — Lokalna logika aplikacji

Dodać:

* lokalny stan aplikacji,
* mockowany serwis AI,
* zapis posiłków lokalnie,
* edycję posiłków,
* usuwanie posiłków,
* przeliczanie kalorii na dashboardzie,
* limit darmowych analiz,
* przejście do Premium po przekroczeniu limitu.

---

### Etap 3 — Backend i baza danych

Dodać:

* Supabase Auth,
* Supabase Database,
* Supabase Storage,
* zapis zdjęć,
* zapis posiłków,
* pobieranie historii,
* aktualizację profilu użytkownika.

---

### Etap 4 — AI

Dodać:

* backendowy endpoint do analizy zdjęcia,
* integrację z modelem AI,
* walidację odpowiedzi AI,
* logowanie kosztów zapytań,
* obsługę błędów,
* komunikaty loading/error/success.

---

### Etap 5 — Subskrypcje

Dodać:

* RevenueCat,
* plan miesięczny,
* plan roczny,
* status Premium,
* blokadę limitów dla darmowych użytkowników,
* ekran paywall.

---

### Etap 6 — Przygotowanie do publikacji

Przygotować aplikację do publikacji na:

* App Store,
* Google Play.

Wymagane elementy:

* ikona aplikacji,
* splash screen,
* opisy aplikacji,
* screeny promocyjne,
* regulamin,
* polityka prywatności,
* obsługa usuwania konta,
* konfiguracja subskrypcji,
* testy na iOS,
* testy na Androidzie.

---

## Uruchomienie projektu

Docelowo projekt powinien działać komendami:

```bash
npm install
npm run start
```

Dla iOS:

```bash
npm run ios
```

Dla Androida:

```bash
npm run android
```

---

## Prompt startowy dla Codexa

```text
Zbuduj aplikację mobilną FotoKalorie w React Native + Expo + TypeScript.

Aplikacja ma działać na dwóch platformach: iOS i Android.

FotoKalorie to aplikacja do liczenia kalorii ze zdjęcia posiłku. Użytkownik robi zdjęcie jedzenia albo wybiera zdjęcie z galerii, aplikacja wysyła zdjęcie do backendu, backend analizuje je przy użyciu AI, a aplikacja pokazuje szacowaną liczbę kalorii, makroskładniki i wykryte składniki.

Na start przygotuj MVP z mockowanymi danymi i kompletnym UI.

Wymagane ekrany:
1. Onboarding
2. Login
3. Register
4. Profile Setup
5. Home Dashboard
6. Camera / Add Photo
7. Photo Analysis Result
8. Edit Portion
9. Meal History
10. Progress
11. Profile
12. Subscription Premium

Styl:
- nowoczesny health-tech,
- jasne tło,
- zielone akcenty,
- zaokrąglone karty,
- czytelna typografia,
- minimalistyczny wygląd,
- język aplikacji: polski.

Dolna nawigacja:
- Start
- Aparat
- Historia
- Profil

Na tym etapie użyj mock data. Nie implementuj jeszcze prawdziwego API AI, Supabase ani RevenueCat, ale przygotuj strukturę serwisów, typów i funkcji tak, aby później można było łatwo podpiąć backend, AI i subskrypcje.

Użyj:
- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- komponentów wielokrotnego użytku
- dobrze uporządkowanej struktury folderów

Projekt musi dać się uruchomić komendami:

npm install
npm run start

Dodatkowo przygotuj skrypty:

npm run ios
npm run android
```

---

## Prompt dla Codexa — etap 2

```text
Teraz dodaj lokalną logikę aplikacji.

Dodaj:
1. Zustand do zarządzania stanem posiłków.
2. Mockowany serwis AI, który po dodaniu zdjęcia zwraca przykładową analizę posiłku.
3. Możliwość zapisania wyniku analizy do historii.
4. Możliwość edycji porcji i kalorii.
5. Możliwość usunięcia posiłku.
6. Przeliczanie sumy kalorii na dashboardzie.
7. Ekran historii z filtrowaniem po dacie.
8. Prosty ekran profilu użytkownika z celem kalorycznym.
9. Limit darmowych analiz, np. 5 miesięcznie.
10. Ekran Premium, gdy użytkownik przekroczy limit.

Nie podpinaj jeszcze prawdziwych płatności ani prawdziwego AI. Wszystko ma działać lokalnie na mockach, ale struktura kodu ma być gotowa pod backend.
```

---

## Prompt dla Codexa — etap 3

```text
Teraz przygotuj integrację backendową z Supabase.

Dodaj:
1. Supabase client.
2. Typy dla users, user_profiles, meals, meal_items, ai_analysis_logs i subscriptions.
3. Auth: login, register, logout.
4. Zapisywanie posiłków w Supabase.
5. Pobieranie historii posiłków z Supabase.
6. Supabase Storage dla zdjęć posiłków.
7. Serwis analyzeMealPhoto, który będzie wysyłał zdjęcie do endpointu backendowego.
8. Obsługę loading/error/success.
9. Zabezpieczenie, aby klucz API AI nigdy nie był używany bezpośrednio w aplikacji mobilnej.

Zostaw miejsce na edge function lub backend endpoint do analizy AI.
```

---

## Prompt dla Codexa — etap 4

```text
Teraz przygotuj integrację z AI.

Dodaj backendowy endpoint lub Supabase Edge Function:

POST /api/analyze-meal-photo

Endpoint ma:
1. Sprawdzić użytkownika.
2. Sprawdzić limit analiz.
3. Pobrać zdjęcie posiłku.
4. Wysłać zdjęcie do modelu AI obsługującego obraz.
5. Wymusić odpowiedź w formacie JSON.
6. Zweryfikować odpowiedź.
7. Zapisać wynik w tabelach meals i meal_items.
8. Zapisać log w ai_analysis_logs.
9. Zwrócić wynik do aplikacji mobilnej.

Pamiętaj:
- klucz API AI musi być wyłącznie po stronie backendu,
- aplikacja mobilna nie może mieć dostępu do klucza API,
- wyniki muszą być oznaczone jako szacunkowe,
- obsłuż przypadek, gdy zdjęcie nie przedstawia jedzenia.
```

---

## Prompt dla Codexa — etap 5

```text
Teraz przygotuj subskrypcje przez RevenueCat dla iOS i Androida.

Dodaj:
1. Konfigurację RevenueCat.
2. Status użytkownika: free / premium.
3. Plan miesięczny Premium.
4. Przygotowanie pod plan roczny.
5. Blokadę analiz po przekroczeniu limitu darmowego.
6. Ekran Premium jako paywall.
7. Przywracanie zakupów.
8. Obsługę błędów płatności.
9. Informację o aktywnej subskrypcji w profilu.

Aplikacja ma działać zarówno na iOS, jak i Androidzie.
```

---

## Ważne założenia

1. Aplikacja ma działać na iOS i Androidzie.
2. Kod powinien być wspólny dla obu platform.
3. Wyniki AI są tylko szacunkowe.
4. Klucz API AI nigdy nie może być zapisany w aplikacji mobilnej.
5. Subskrypcje powinny być obsługiwane przez RevenueCat.
6. Backend powinien kontrolować limity analiz.
7. Użytkownik powinien móc poprawić wynik AI.
8. MVP powinno najpierw działać na mockach.
9. Dopiero później dodajemy prawdziwe AI, backend i płatności.
10. Projekt powinien mieć czystą strukturę i komponenty wielokrotnego użytku.
