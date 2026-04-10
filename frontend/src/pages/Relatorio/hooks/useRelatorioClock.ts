import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRelatorioClock,
  setRelatorioClockSimulation,
} from "../../../services/relatorioService";
import type { RelatorioClockSnapshot } from "../../../types/relatorio";
import type { FeedbackState } from "../types";

type RelatorioStatus = "ABERTO" | "FECHADO";

type UseRelatorioClockParams = {
  token: string | null;
  relatorioId: number | null;
  relatorioStatus: RelatorioStatus;
  setRelatorioStatus: Dispatch<SetStateAction<RelatorioStatus>>;
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
};

type ApplySnapshotOptions = {
  allowRedirect?: boolean;
};

const DEFAULT_SIMULATION_START = "23:58";

function getCountdownFromMs(msToMidnight: number) {
  const totalSeconds = Math.max(0, Math.ceil(msToMidnight / 1000));

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function useRelatorioClock({
  token,
  relatorioId,
  relatorioStatus,
  setRelatorioStatus,
  setFeedback,
}: UseRelatorioClockParams) {
  const navigate = useNavigate();
  const [countdownMinutes, setCountdownMinutes] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [clockSimulationStart, setClockSimulationStart] = useState<string | null>(null);

  const clockBusinessKeyRef = useRef<string | null>(null);
  const autoRedirectTriggeredRef = useRef(false);

  const applySnapshot = (snapshot: RelatorioClockSnapshot, options?: ApplySnapshotOptions) => {
    setClockSimulationStart(snapshot.simulationEnabled ? snapshot.simulationStart : null);

    if (snapshot.showCountdown) {
      const countdown = getCountdownFromMs(snapshot.msToMidnight);
      setCountdownMinutes(countdown.minutes);
      setCountdownSeconds(countdown.seconds);
    } else {
      setCountdownMinutes(null);
      setCountdownSeconds(null);
    }

    if (!clockBusinessKeyRef.current) {
      clockBusinessKeyRef.current = snapshot.businessDateKey;
      return;
    }

    const viradaDetectada = snapshot.businessDateKey !== clockBusinessKeyRef.current;
    if (!viradaDetectada || autoRedirectTriggeredRef.current || options?.allowRedirect === false) {
      return;
    }

    autoRedirectTriggeredRef.current = true;
    setRelatorioStatus("FECHADO");
    setFeedback({
      type: "success",
      message: "Relatório fechado automaticamente à meia-noite. Redirecionando...",
    });

    window.setTimeout(() => {
      navigate("/dashboard", {
        replace: true,
        state: { message: "Relatório anterior fechado automaticamente à meia-noite." },
      });
    }, 800);
  };

  useEffect(() => {
    clockBusinessKeyRef.current = null;
    autoRedirectTriggeredRef.current = false;
  }, [relatorioId]);

  useEffect(() => {
    if (!token || !relatorioId || relatorioStatus === "FECHADO") {
      return;
    }

    let cancelled = false;

    const syncClock = async () => {
      try {
        const snapshot = await getRelatorioClock(token);

        if (cancelled) {
          return;
        }

        applySnapshot(snapshot);
      } catch {
        setCountdownMinutes(null);
        setCountdownSeconds(null);
      }
    };

    void syncClock();
    const intervalId = window.setInterval(() => {
      void syncClock();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [relatorioId, relatorioStatus, token]);

  const startSimulation = async (start: string = DEFAULT_SIMULATION_START) => {
    if (!token || !relatorioId || relatorioStatus === "FECHADO") {
      return null;
    }

    const snapshot = await setRelatorioClockSimulation(start, token);
    applySnapshot(snapshot, { allowRedirect: false });
    return snapshot;
  };

  return {
    countdownMinutes,
    countdownSeconds,
    clockSimulationStart,
    startSimulation,
    defaultSimulationStart: DEFAULT_SIMULATION_START,
  };
}
