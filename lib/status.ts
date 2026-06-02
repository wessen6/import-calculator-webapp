import type { CalculationStatus } from "./types";

export const STATUS_LABELS: Record<CalculationStatus, string> = {
  need_more_data: "Нужно уточнение",
  ready_for_confirmation: "Готово к подтверждению",
  processing: "Расчёт выполняется",
  completed: "Выполнен",
  error: "Ошибка"
};

export const STATUS_DESCRIPTIONS: Record<CalculationStatus, string> = {
  need_more_data: "Не хватает данных или нужно проверить введённые значения.",
  ready_for_confirmation: "Данные заполнены, расчёт можно отправить в обработку.",
  processing: "Расчёт уже выполняется, результат появится позже.",
  completed: "Итоговый расчёт готов.",
  error: "Во время обработки возникла ошибка."
};
