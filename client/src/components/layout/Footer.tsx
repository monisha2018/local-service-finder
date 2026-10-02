import Icon from "../ui/Icon";

const FOOTER_LINKS = {
  "Quick Links": ["About Us", "Our Services", "Become a Provider"],
  Support: ["Help Center", "Safety & Trust", "Contact Support"],
};

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container py-lg border-t border-outline-variant">
      <div className="max-w-container-max mx-auto px-md lg:px-lg grid grid-cols-1 md:grid-cols-4 gap-lg">
        <div className="space-y-sm">
          <div className="flex items-center gap-xs">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Icon name="verified" className="text-on-primary text-[14px]" />
            </div>
            <span className="font-label-lg text-label-lg text-on-surface">Local Service Finder</span>
          </div>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Connecting you with the best local professionals for all your home and business needs.
          </p>
        </div>

        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="flex flex-col gap-sm">
            <h4 className="font-label-lg text-label-lg text-on-surface">{heading}</h4>
            {links.map((l) => (
              <a key={l} className="text-body-md font-body-md text-on-surface-variant hover:text-primary" href="#">
                {l}
              </a>
            ))}
          </div>
        ))}

        <div className="flex flex-col gap-sm">
          <h4 className="font-label-lg text-label-lg text-on-surface">Follow Us</h4>
          <div className="flex gap-sm">
            <Icon name="share" className="text-on-surface-variant hover:text-primary cursor-pointer" />
            <Icon name="public" className="text-on-surface-variant hover:text-primary cursor-pointer" />
            <Icon name="groups" className="text-on-surface-variant hover:text-primary cursor-pointer" />
          </div>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-md lg:px-lg mt-lg pt-md border-t border-outline-variant text-center">
        <p className="text-label-md font-label-md text-on-surface-variant">© {new Date().getFullYear()} Local Service Finder. All rights reserved.</p>
      </div>
    </footer>
  );
}
