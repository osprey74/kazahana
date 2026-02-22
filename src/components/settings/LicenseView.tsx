import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";

const LICENSE_TEXT = `MIT License

Copyright (c) 2026 osprey74

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export function LicenseView() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/settings")}
          className="text-sm text-primary hover:underline"
        >
          <Icon name="arrow_back" size={16} className="inline-block align-text-bottom" /> {t("thread.back")}
        </button>
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">{t("settings.license")}</h2>
      </div>
      <pre className="text-xs text-text-light dark:text-text-dark whitespace-pre-wrap font-mono leading-relaxed">
        {LICENSE_TEXT}
      </pre>
    </div>
  );
}
