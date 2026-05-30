/**
 * アプリのルート（要件§18）。
 *
 * - DigitizationProvider で全Step共有の状態を提供。
 * - currentStep でどのStepを表示するか管理（画面遷移型）。
 * - 上部に StepNavigator（Step表示・戻る/次へ）、下に現在のStepページ。
 */
import { useState } from 'react';
import { DigitizationProvider } from './context/DigitizationContext';
import { StepNavigator, TOTAL_STEPS } from './components/StepNavigator';
import { Step0AudioSetup } from './pages/Step0AudioSetup';
import { Step1Sampling } from './pages/Step1Sampling';
import { Step2Quantization } from './pages/Step2Quantization';
import { Step3Encoding } from './pages/Step3Encoding';
import styles from './App.module.css';

export function App() {
  const [currentStep, setCurrentStep] = useState(0);

  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goNext = () => setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  return (
    <DigitizationProvider>
      <div className={styles.app}>
        <StepNavigator currentStep={currentStep} onPrev={goPrev} onNext={goNext} />
        <main className={styles.main}>
          {currentStep === 0 && <Step0AudioSetup />}
          {currentStep === 1 && <Step1Sampling />}
          {currentStep === 2 && <Step2Quantization />}
          {currentStep === 3 && <Step3Encoding />}
        </main>
      </div>
    </DigitizationProvider>
  );
}
