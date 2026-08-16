import Icon from './Icon'

function KpiCard({ label, value, meta, metaClass = 'is-neutral', icon }) {
  return (
    <article className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-label">{label}</span>
        {icon && (
          <span className="kpi-icon-badge">
            {typeof icon === 'string' ? <Icon name={icon} size={20} /> : icon}
          </span>
        )}
      </div>
      <strong className="kpi-value">{value}</strong>
      {meta && <span className={`kpi-trend ${metaClass}`}>{meta}</span>}
    </article>
  )
}

export default KpiCard
